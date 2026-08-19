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
   * Reads a namespaced key, migrating a pre-existing unscoped value into it on first read.
   *
   * Namespacing alone would make every existing visitor's cart/prefill/last-order vanish the
   * next time they load the site, since it now looks for a key that never existed. Adopting
   * the legacy value once (and removing it) keeps that from happening while still landing on
   * the namespaced key for every read/write after.
   */
  private readMigrated(base: string): string | null {
    const namespacedKey = this.storageKey(base);
    const existing = localStorage.getItem(namespacedKey);
    if (existing !== null) return existing;

    // No slug resolved yet, so the "namespaced" key is the bare key — nothing to migrate.
    if (namespacedKey === base) return null;

    const legacy = localStorage.getItem(base);
    if (legacy === null) return null;

    localStorage.setItem(namespacedKey, legacy);
    localStorage.removeItem(base);
    return legacy;
  }

  private loadStoredItems(): CartItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = this.readMigrated(CART_STORAGE_KEY);
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
      const raw = this.readMigrated(PREFILL_STORAGE_KEY);
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
      const raw = this.readMigrated(LAST_ORDER_STORAGE_KEY);
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
