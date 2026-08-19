import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@invento/user-site/environments/environment';
import { StoreSlugService } from './store-slug.service';
import type {
  CartItem,
  CreateOrderPayload,
  PlacedOrderResponse,
  PrefillCustomerInfo,
} from '@invento/user-site/app/core/interface/cart.interface';

const CART_STORAGE_KEY = 'invento_user_cart';
const PREFILL_STORAGE_KEY = 'invento_user_checkout_prefill';
const LAST_ORDER_STORAGE_KEY = 'invento_last_placed_order';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Resolved from the URL/host, never a build-time constant — see {@link storageKey}.
   */
  private readonly storeSlug = inject(StoreSlugService).slug;

  // Cart state signals
  readonly items = signal<CartItem[]>(this.loadStoredItems());
  readonly prefilledCustomer = signal<PrefillCustomerInfo | null>(this.loadStoredPrefill());
  readonly currency = signal<string>('EGP');
  readonly lastPlacedOrder = signal<PlacedOrderResponse | null>(this.loadStoredLastOrder());

  // Computed state
  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0),
  );

  // Subtotal in minor units (e.g. 59700 = 597.00)
  readonly subtotalAmount = computed(() =>
    this.items().reduce((total, item) => total + (item.unitAmount || 0) * item.quantity, 0),
  );

  readonly shippingFee = computed(() => 0);

  readonly totalAmount = computed(() => this.subtotalAmount() + this.shippingFee());

  /**
   * Set reorder items and prefilled customer info from an existing order
   */
  setReorder(items: CartItem[], prefill?: PrefillCustomerInfo, currency?: string): void {
    if (currency) {
      this.currency.set(currency);
    }
    this.items.set(items);
    this.saveStoredItems(items);

    if (prefill) {
      this.prefilledCustomer.set(prefill);
      this.saveStoredPrefill(prefill);
    }
  }

  /**
   * Add a single item to cart or increment quantity if variant already in cart
   */
  addItem(item: CartItem): void {
    this.items.update((current) => {
      const existingIdx = current.findIndex((i) => i.variantId === item.variantId);
      if (existingIdx > -1) {
        const updated = [...current];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: Math.min(100, updated[existingIdx].quantity + item.quantity),
        };
        return updated;
      }
      return [...current, item];
    });
    this.saveStoredItems(this.items());
  }

  /**
   * Update quantity of a line item
   */
  updateQuantity(index: number, delta: number): void {
    this.items.update((current) => {
      if (index < 0 || index >= current.length) return current;
      const updated = [...current];
      const newQty = updated[index].quantity + delta;

      if (newQty <= 0) {
        // Remove item if quantity falls to 0
        updated.splice(index, 1);
      } else {
        updated[index] = {
          ...updated[index],
          quantity: Math.min(100, newQty),
        };
      }
      return updated;
    });
    this.saveStoredItems(this.items());
  }

  /**
   * Remove item from cart by index
   */
  removeItem(index: number): void {
    this.items.update((current) => {
      const updated = [...current];
      updated.splice(index, 1);
      return updated;
    });
    this.saveStoredItems(this.items());
  }

  /**
   * Clear all items in cart
   */
  clearCart(): void {
    this.items.set([]);
    this.saveStoredItems([]);
  }

  /**
   * Set prefill customer details
   */
  setPrefilledCustomer(info: PrefillCustomerInfo): void {
    this.prefilledCustomer.set(info);
    this.saveStoredPrefill(info);
  }

  /**
   * Clear prefill state
   */
  clearPrefill(): void {
    this.prefilledCustomer.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey(PREFILL_STORAGE_KEY));
    }
  }

  /**
   * Place Order (Checkout)
   * POST /site/{slug}/orders
   */
  placeOrder(slug: string, payload: CreateOrderPayload): Observable<PlacedOrderResponse> {
    return this.http.post<PlacedOrderResponse>(`${this.apiUrl}/site/${slug}/orders`, payload);
  }

  setLastPlacedOrder(order: PlacedOrderResponse): void {
    this.lastPlacedOrder.set(order);
    this.saveStoredLastOrder(order);
  }

  clearLastPlacedOrder(): void {
    this.lastPlacedOrder.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey(LAST_ORDER_STORAGE_KEY));
    }
  }

  /**
   * Namespaces a storage key with the active store's slug.
   *
   * The storefront is multi-tenant: in production each store is its own subdomain, so origin
   * isolation keeps carts apart for free, but in development every store shares
   * `localhost:4300` — add to cart on `/emberbean`, switch to `/fokhar`, and store A's items
   * would appear (and could be submitted) in store B's cart under a single global key. Falls
   * back to the bare key when no slug has resolved (e.g. off-storefront routes) since there is
   * no tenant to namespace by.
   */
  private storageKey(base: string): string {
    const slug = this.storeSlug();
    return slug ? `${base}:${slug}` : base;
  }

  /**
   * Reads a namespaced key ONLY — no adoption of the legacy unscoped key.
   *
   * This used to migrate a pre-existing unscoped value (e.g. bare `invento_user_cart`) into the
   * namespaced one on first read, on the theory that namespacing alone would make an existing
   * visitor's cart vanish. In practice that legacy value has unknowable provenance: it may have
   * been built while browsing a completely different — or since-deleted — store, so its
   * `variantId`s are foreign to whichever store the shopper opens next. The backend then rejects
   * checkout with a generic "one of these products is no longer available" (see
   * `BACKEND/src/orders/checkout.service.ts` `describeUnavailable()`), and there was no way for
   * the shopper to tell which line item was actually the problem, or why. A cart silently
   * reappearing under the wrong store is worse than one that doesn't reappear at all, so
   * adoption was removed outright rather than made "smarter" — there's no reliable way to tell
   * a legacy cart's true store from the stored value alone.
   */
  private readNamespaced(base: string): string | null {
    return localStorage.getItem(this.storageKey(base));
  }

  private loadStoredItems(): CartItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = this.readNamespaced(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredItems(items: CartItem[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey(CART_STORAGE_KEY), JSON.stringify(items));
    } catch {
      // Ignore storage write errors
    }
  }

  private loadStoredPrefill(): PrefillCustomerInfo | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = this.readNamespaced(PREFILL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveStoredPrefill(prefill: PrefillCustomerInfo): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey(PREFILL_STORAGE_KEY), JSON.stringify(prefill));
    } catch {
      // Ignore storage write errors
    }
  }

  private loadStoredLastOrder(): PlacedOrderResponse | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = this.readNamespaced(LAST_ORDER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveStoredLastOrder(order: PlacedOrderResponse): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey(LAST_ORDER_STORAGE_KEY), JSON.stringify(order));
    } catch {
      // Ignore storage write errors
    }
  }
}
