import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, tap, throwError } from 'rxjs';
import { LocaleService } from '@invento/core';
import { extractErrorMessage } from '@invento/shared-util-error';
import type {
  CancelOrderPayload,
  MyOrdersResponse,
  OrderDetail,
  OrderFilter,
  OrderStatus,
  OrderStatusConfig,
  OrderSummaryItem,
} from '@invento/user-site/app/features/orders';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { environment } from '@invento/user-site/environments/environment';

const RECIPIENT_OVERRIDES_KEY = 'invento_order_recipients';

/**
 * Server-side page size for the one-time full load of a shopper's orders per store visit.
 * Filtering, search and pagination all run client-side against whatever this call returns
 * (see the comment above `filteredOrders`), so the whole history a shopper might filter or
 * search across has to already be in memory.
 *
 * 100 is not arbitrary: it is `MAX_PAGE_SIZE` in
 * `BACKEND/src/common/dto/pagination-query.dto.ts`, whose `@Max(100)` rejects anything larger
 * with a 400. So this is the most the API will hand over in one request, and raising it
 * requires a backend change rather than a bigger number here.
 */
export const ORDERS_SERVER_LOAD_LIMIT = 100;

/** Client-side page size for `pagedOrders`. Small because order cards are tall. */
export const ORDERS_CLIENT_PAGE_SIZE = 5;

@Injectable({
  providedIn: 'root',
})
export class OrdersDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  // Class-side error fallbacks are translated here rather than by the pipe — they're plain
  // strings stored in a signal, not template text.
  private readonly locale = inject(LocaleService);

  private readonly _orders = signal<OrderSummaryItem[]>([]);
  private readonly _orderDetailsMap = signal<Map<number, OrderDetail>>(new Map());
  private readonly _loadingDetails = signal<Set<number>>(new Set());
  private readonly _isCancelling = signal<number | null>(null);

  private readonly _selectedFilter = signal<OrderFilter>('all');
  private readonly _searchQuery = signal<string>('');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isUnauthorized = signal<boolean>(false);

  private readonly _currentPage = signal<number>(1);
  private readonly _limit = signal<number>(20);
  private readonly _totalPages = signal<number>(1);
  private readonly _totalCount = signal<number>(0);

  /**
   * Client-side page the shopper is viewing within `filteredOrders()`. Separate from
   * `_currentPage`, which tracks the SERVER page fetched by `loadOrders`/`setPage`. See the
   * comment above `filteredOrders` for why pagination moved to the client.
   */
  private readonly _clientPage = signal<number>(1);
  /** Seeded from the URL, not a constant — a stale fallback would fetch another tenant's orders. */
  private readonly _urlSlug = inject(StoreSlugService).slug;
  private readonly _activeStoreSlug = signal<string>('');

  // Readonly public signals
  readonly orders = this._orders.asReadonly();
  readonly orderDetailsMap = this._orderDetailsMap.asReadonly();
  readonly loadingDetails = this._loadingDetails.asReadonly();
  readonly isCancelling = this._isCancelling.asReadonly();
  readonly selectedFilter = this._selectedFilter.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isUnauthorized = this._isUnauthorized.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly limit = this._limit.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly activeStoreSlug = this._activeStoreSlug.asReadonly();
  readonly clientPage = this._clientPage.asReadonly();
  readonly clientPageSize = ORDERS_CLIENT_PAGE_SIZE;

  /**
   * Filtering, search, and pagination below (`filteredOrders`, `pagedOrders`,
   * `clientTotalPages`) all run CLIENT-SIDE, over the single generously-sized server page
   * fetched by `loadOrders`. That is because `GET /site/:slug/orders/me` accepts only `page`
   * and `limit` — no status filter, no search (see
   * `BACKEND/src/orders/customer-orders.controller.ts`, which takes a bare
   * `PaginationQueryDto`). Filtering against one server page only ever "worked" by accident
   * when a store had few enough orders to fit in it.
   *
   * This stops being appropriate once a shopper's order history grows past
   * `ORDERS_SERVER_LOAD_LIMIT`: at that point results silently go missing from filters/search
   * again, and the fix is a real backend filter/search query param, not a bigger limit.
   */
  readonly filteredOrders = computed(() => {
    const filter = this._selectedFilter();
    const query = this._searchQuery().trim().toLowerCase();

    return this._orders().filter((order) => {
      const matchesFilter = filter === 'all' || order.status === filter;
      if (!matchesFilter) return false;

      if (!query) return true;

      const orderNumberMatch =
        order.orderNumber.toString().includes(query) || `#${order.orderNumber}`.includes(query);
      const contactMatch =
        order.contactName?.toLowerCase().includes(query) ||
        order.contactEmail?.toLowerCase().includes(query);

      // Also match items if details are already loaded in memory
      const cachedDetail = this._orderDetailsMap().get(order.orderNumber);
      const itemMatch = cachedDetail?.items?.some(
        (item) =>
          item.productTitle?.toLowerCase().includes(query) ||
          item.sku?.toLowerCase().includes(query),
      );

      return orderNumberMatch || !!contactMatch || !!itemMatch;
    });
  });

  /** Total client-side pages over `filteredOrders()`, at `ORDERS_CLIENT_PAGE_SIZE` per page. */
  readonly clientTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredOrders().length / ORDERS_CLIENT_PAGE_SIZE)),
  );

  /** The slice of `filteredOrders()` for the current client page — what the template renders. */
  readonly pagedOrders = computed(() => {
    const page = this._clientPage();
    const start = (page - 1) * ORDERS_CLIENT_PAGE_SIZE;
    return this.filteredOrders().slice(start, start + ORDERS_CLIENT_PAGE_SIZE);
  });

  readonly statusCounts = computed(() => {
    const orders = this._orders();
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  });

  readonly totalSpent = computed(() => {
    return this._orders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0) / 100, 0);
  });

  readonly currency = computed(() => {
    const orders = this._orders();
    return orders.length > 0 && orders[0].currency ? orders[0].currency : 'EGP';
  });

  // --- API Observable Methods ---

  getMyOrders(slug: string, page = 1, limit = 20): Observable<MyOrdersResponse> {
    const storeSlug = slug || this._activeStoreSlug() || this._urlSlug();
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<MyOrdersResponse>(`${this.apiUrl}/site/${storeSlug}/orders/me`, {
      params,
    });
  }

  getMyOrder(slug: string, orderNumber: number): Observable<OrderDetail> {
    const storeSlug = slug || this._activeStoreSlug() || this._urlSlug();
    return this.http.get<OrderDetail>(`${this.apiUrl}/site/${storeSlug}/orders/me/${orderNumber}`);
  }

  cancelMyOrder(
    slug: string,
    orderNumber: number,
    payload?: CancelOrderPayload,
  ): Observable<OrderDetail> {
    const storeSlug = slug || this._activeStoreSlug() || this._urlSlug();
    return this.http.post<OrderDetail>(
      `${this.apiUrl}/site/${storeSlug}/orders/me/${orderNumber}/cancel`,
      payload || {},
    );
  }

  /**
   * Namespaces a storage key with the active store's slug.
   *
   * The storefront is multi-tenant: in production each store is its own subdomain, so origin
   * isolation keeps this apart for free, but in development every store shares
   * `localhost:4300` — a recipient-name override entered for an order on `/emberbean` would
   * otherwise be visible to (and could be matched against) order numbers on `/fokhar` under a
   * single global key. Falls back to the bare key when no slug has resolved.
   */
  private storageKey(base: string): string {
    const slug = this._activeStoreSlug() || this._urlSlug();
    return slug ? `${base}:${slug}` : base;
  }

  /**
   * Reads the namespaced recipient-overrides map ONLY — no adoption of the legacy unscoped key.
   *
   * This used to migrate a pre-existing unscoped value into the namespaced one on first read.
   * Removed for the same reason as `CartService`'s equivalent (see its `readNamespaced` doc): a
   * value under the unscoped key has unknowable provenance — it may have been saved while
   * browsing a different store entirely — so silently adopting it into whichever store the
   * shopper opens first can attach the wrong recipient name to that store's orders.
   */
  private readRecipientOverrides(): string | null {
    return localStorage.getItem(this.storageKey(RECIPIENT_OVERRIDES_KEY));
  }

  saveRecipientOverride(orderNumber: number, contactName: string): void {
    if (typeof localStorage === 'undefined' || !orderNumber || !contactName) return;
    try {
      const raw = this.readRecipientOverrides();
      const map: Record<number, string> = raw ? JSON.parse(raw) : {};
      map[orderNumber] = contactName;
      localStorage.setItem(this.storageKey(RECIPIENT_OVERRIDES_KEY), JSON.stringify(map));
    } catch {
      // Ignore storage write errors
    }
  }

  getRecipientOverride(orderNumber: number): string | null {
    if (typeof localStorage === 'undefined' || !orderNumber) return null;
    try {
      const raw = this.readRecipientOverrides();
      if (!raw) return null;
      const map: Record<number, string> = JSON.parse(raw);
      return map[orderNumber] || null;
    } catch {
      return null;
    }
  }

  // --- Reactive State Management ---

  loadOrders(slug?: string, page = 1, limit = 20): void {
    const storeSlug = slug || this._activeStoreSlug() || this._urlSlug();
    this._activeStoreSlug.set(storeSlug);
    this._isLoading.set(true);
    this._error.set(null);
    this._isUnauthorized.set(false);

    this.getMyOrders(storeSlug, page, limit)
      .pipe(
        tap((res) => {
          const rawItems = res.items || [];
          const items = rawItems.map((item) => {
            const override = this.getRecipientOverride(item.orderNumber);
            return override ? { ...item, contactName: override } : item;
          });

          this._orders.set(items);
          this._currentPage.set(res.page || 1);
          this._limit.set(res.limit || 20);
          this._totalCount.set(res.total || 0);
          this._totalPages.set(res.totalPages || 1);
          this._isLoading.set(false);

          // Prefetch details for all returned orders for instant, rich rendering
          if (items.length > 0) {
            items.forEach((orderItem) => {
              if (orderItem.orderNumber != null) {
                this.loadOrderDetails(orderItem.orderNumber, storeSlug);
              }
            });
          }
        }),
        catchError((err) => {
          this._isLoading.set(false);
          if (err.status === 401) {
            this._isUnauthorized.set(true);
            this._error.set(this.locale.translate('orders.errors.login_required'));
          } else {
            const errorMsg = extractErrorMessage(
              err,
              this.locale.translate('orders.errors.fetch_failed'),
            );
            this._error.set(errorMsg);
          }
          return throwError(() => err);
        }),
      )
      .subscribe({
        error: (err: unknown) => {
          console.error('[OrdersDataService] Failed loading orders:', err);
        },
      });
  }

  async loadOrderDetails(orderNumber: number, slug?: string): Promise<OrderDetail | null> {
    // Check if already cached
    const currentMap = this._orderDetailsMap();
    if (currentMap.has(orderNumber)) {
      return currentMap.get(orderNumber)!;
    }

    const storeSlug = slug || this._activeStoreSlug() || this._urlSlug();

    // Mark as loading
    this._loadingDetails.update((set) => {
      const next = new Set(set);
      next.add(orderNumber);
      return next;
    });

    try {
      const detail = await firstValueFrom(this.getMyOrder(storeSlug, orderNumber));
      const override = this.getRecipientOverride(orderNumber);
      const enrichedDetail = override ? { ...detail, contactName: override } : detail;

      this._orderDetailsMap.update((map) => {
        const next = new Map(map);
        next.set(orderNumber, enrichedDetail);
        return next;
      });
      return enrichedDetail;
    } catch (err) {
      console.error(`Failed to load details for order #${orderNumber}`, err);
      return null;
    } finally {
      this._loadingDetails.update((set) => {
        const next = new Set(set);
        next.delete(orderNumber);
        return next;
      });
    }
  }

  async cancelOrder(
    orderNumber: number,
    reason?: string,
    slug?: string,
  ): Promise<{ success: boolean; message?: string }> {
    const storeSlug = slug || this._activeStoreSlug() || this._urlSlug();
    this._isCancelling.set(orderNumber);

    try {
      const updatedOrder = await firstValueFrom(
        this.cancelMyOrder(storeSlug, orderNumber, { reason: reason?.trim() || undefined }),
      );

      // Update in orders list
      this._orders.update((list) =>
        list.map((item) =>
          item.orderNumber === orderNumber ? { ...item, status: 'cancelled' as const } : item,
        ),
      );

      // Update in details cache if present
      this._orderDetailsMap.update((map) => {
        const next = new Map(map);
        if (next.has(orderNumber)) {
          next.set(orderNumber, updatedOrder);
        }
        return next;
      });

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(
        err,
        this.locale.translate('orders.errors.cancel_failed_fallback'),
      );
      return { success: false, message: errorMsg };
    } finally {
      this._isCancelling.set(null);
    }
  }

  setFilter(filter: OrderFilter): void {
    this._selectedFilter.set(filter);
    // A shopper on client page 3 who narrows the filter to 4 results must not land on a
    // blank page — always snap back to page 1 when the result set changes shape.
    this._clientPage.set(1);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
    this._clientPage.set(1);
  }

  /** Changes the CLIENT page over `filteredOrders()`. Drives `pagedOrders`. */
  setClientPage(page: number): void {
    if (page >= 1 && page <= this.clientTotalPages()) {
      this._clientPage.set(page);
    }
  }

  /**
   * Kept for the underlying server-paged fetch (`loadOrders` itself), but no longer used to
   * drive the visible pagination control — see the comment above `filteredOrders`. Left intact
   * in case the backend later grows real filter/search query params and this becomes the
   * server-driven path again.
   */
  setPage(page: number): void {
    if (page >= 1 && page <= this._totalPages()) {
      this.loadOrders(this._activeStoreSlug(), page, this._limit());
    }
  }

  /**
   * Maps each order status to the theme's semantic tokens (`--success`/`--warning`/
   * `--destructive`/`--primary`, from `libs/core/src/styles/spartan-theme.css`) instead of
   * hardcoded Tailwind palette colours, and to a translation key instead of a hardcoded
   * English label — the orders templates already moved to semantic tokens; this service was
   * the one place still hardcoding both.
   *
   * `shipped` and `confirmed` both read as "in progress" so they share `primary`, since the
   * theme has no separate token for that distinction; `shipped` keeps the pulse the badge had
   * before so the two remain visually distinguishable in the badge dot.
   */
  getStatusConfig(status: OrderStatus): OrderStatusConfig {
    switch (status) {
      case 'delivered':
        return {
          label: 'orders.status.delivered',
          badgeClass: 'bg-success/10 text-success border border-success/20',
          dotClass: 'bg-success',
          icon: 'lucideCircleCheck',
        };
      case 'shipped':
        return {
          label: 'orders.status.shipped',
          badgeClass: 'bg-primary/10 text-primary border border-primary/20',
          dotClass: 'bg-primary animate-pulse',
          icon: 'lucideTruck',
        };
      case 'confirmed':
        return {
          label: 'orders.status.confirmed',
          badgeClass: 'bg-primary/10 text-primary border border-primary/20',
          dotClass: 'bg-primary',
          icon: 'lucideCircleCheck',
        };
      case 'pending':
        return {
          label: 'orders.status.pending',
          badgeClass: 'bg-warning/10 text-warning border border-warning/20',
          dotClass: 'bg-warning animate-pulse',
          icon: 'lucideClock',
        };
      case 'cancelled':
        return {
          label: 'orders.status.cancelled',
          badgeClass: 'bg-destructive/10 text-destructive border border-destructive/20',
          dotClass: 'bg-destructive',
          icon: 'lucideCircleX',
        };
    }
  }
}
