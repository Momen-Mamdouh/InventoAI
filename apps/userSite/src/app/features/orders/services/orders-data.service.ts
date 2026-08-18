import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, tap, throwError } from 'rxjs';
import { extractErrorMessage } from '@invento/user-site/app/core/utils/error.utils';
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

@Injectable({
  providedIn: 'root',
})
export class OrdersDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

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

  saveRecipientOverride(orderNumber: number, contactName: string): void {
    if (typeof localStorage === 'undefined' || !orderNumber || !contactName) return;
    try {
      const raw = localStorage.getItem(RECIPIENT_OVERRIDES_KEY);
      const map: Record<number, string> = raw ? JSON.parse(raw) : {};
      map[orderNumber] = contactName;
      localStorage.setItem(RECIPIENT_OVERRIDES_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage write errors
    }
  }

  getRecipientOverride(orderNumber: number): string | null {
    if (typeof localStorage === 'undefined' || !orderNumber) return null;
    try {
      const raw = localStorage.getItem(RECIPIENT_OVERRIDES_KEY);
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
            this._error.set('Please log in to view your orders.');
          } else {
            const errorMsg = extractErrorMessage(
              err,
              'Failed to fetch your orders. Please try again later.',
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
      const errorMsg = extractErrorMessage(err, 'Failed to cancel order.');
      return { success: false, message: errorMsg };
    } finally {
      this._isCancelling.set(null);
    }
  }

  setFilter(filter: OrderFilter): void {
    this._selectedFilter.set(filter);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this._totalPages()) {
      this.loadOrders(this._activeStoreSlug(), page, this._limit());
    }
  }

  getStatusConfig(status: OrderStatus): OrderStatusConfig {
    switch (status) {
      case 'delivered':
        return {
          label: 'Delivered',
          badgeClass:
            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          dotClass: 'bg-emerald-500',
          icon: 'lucideCircleCheck',
        };
      case 'shipped':
        return {
          label: 'Shipped',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
          dotClass: 'bg-blue-500 animate-pulse',
          icon: 'lucideTruck',
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
          dotClass: 'bg-sky-500',
          icon: 'lucideCircleCheck',
        };
      case 'pending':
        return {
          label: 'Pending',
          badgeClass:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
          dotClass: 'bg-amber-500 animate-pulse',
          icon: 'lucideClock',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
          dotClass: 'bg-rose-500',
          icon: 'lucideCircleX',
        };
    }
  }
}
