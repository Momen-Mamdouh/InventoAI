import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

import { Home } from '@invento/user-site-feature-home';
import { Products, ProductDetails } from '@invento/user-site-feature-product';
import { Checkout } from '@invento/user-site-feature-checkout';
import { StoreService, StoreSlugService, StorePublic } from '@invento/user-site-data-access-store';
import {
  ProductApiService,
  ProductStore,
  ProductListResponse,
  FilterResponse,
  ProductDetail,
} from '@invento/user-site-data-access-product';
import { CartService, CartItem, PlacedOrderResponse } from '@invento/user-site-data-access-cart';
import { OrdersDataService } from '@invento/user-site-data-access-order';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';

const MOCK_STORE: StorePublic = {
  name: 'Layali Luxury Scents',
  slug: 'layali',
  description: 'Handcrafted oriental perfumes and pure oud',
  logoUrl: 'https://example.com/layali-logo.png',
  logoSource: 'uploaded',
  locale: 'en',
  currency: 'USD',
  contactEmail: 'orders@layali.com',
  hero: {
    imageUrl: 'https://example.com/hero.jpg',
    headline: 'Experience Pure Elegance',
    subtitle: 'Sensory perfumes designed for royalty',
    ctaLabel: 'Explore Catalog',
    ctaHref: '/layali/products',
  },
  theme: null,
  featuredCategories: [
    {
      name: 'Oud Oils',
      slug: 'oud-oils',
      description: 'Aged concentrated oils',
      imageUrl: null,
      productCount: 3,
    },
  ],
  featuredProducts: [
    {
      title: 'Royal Amber EDP',
      slug: 'royal-amber',
      shortDescription: 'Sweet amber and rare woods',
      imageUrl: 'https://example.com/royal-amber.jpg',
      imageAltText: 'Royal Amber Perfume Bottle',
      categories: [],
      minPriceAmount: 180,
      maxPriceAmount: 220,
      inStock: true,
      swatches: [],
    },
  ],
};

const MOCK_PRODUCT_DETAIL: ProductDetail = {
  slug: 'royal-amber',
  title: 'Royal Amber EDP',
  description: 'An enchanting blend of sweet amber, vanilla, and aged cedarwood.',
  shortDescription: 'Sweet amber and rare woods',
  minPriceAmount: 180,
  maxPriceAmount: 220,
  variantCount: 2,
  inStock: true,
  images: [
    { url: 'https://example.com/royal-amber-1.jpg', altText: 'Front View' },
    { url: 'https://example.com/royal-amber-2.jpg', altText: 'Packaging Box' },
  ],
  categories: [{ name: 'Amber', slug: 'amber', description: '', imageUrl: null, productCount: 1 }],
  specs: [],
  variants: [
    {
      id: 'var-amber-50ml',
      priceAmount: 180,
      compareAtAmount: 200,
      inStock: true,
      stockLeft: 10,
      options: [
        {
          attributeKey: 'size',
          attributeName: 'Size',
          value: '50ml',
          slug: '50ml',
          swatchHex: null,
        },
      ],
    },
    {
      id: 'var-amber-100ml',
      priceAmount: 220,
      compareAtAmount: 250,
      inStock: true,
      stockLeft: 5,
      options: [
        {
          attributeKey: 'size',
          attributeName: 'Size',
          value: '100ml',
          slug: '100ml',
          swatchHex: null,
        },
      ],
    },
  ],
};

const MOCK_CATALOG_RESPONSE: ProductListResponse = {
  items: [
    {
      title: 'Royal Amber EDP',
      slug: 'royal-amber',
      shortDescription: 'Sweet amber and rare woods',
      minPriceAmount: 180,
      maxPriceAmount: 220,
      imageUrl: 'https://example.com/royal-amber.jpg',
      imageAltText: 'Royal Amber Perfume',
      categories: [
        { name: 'Amber', slug: 'amber', description: '', imageUrl: null, productCount: 1 },
      ],
      inStock: true,
      swatches: [],
    },
  ],
  total: 1,
  page: 1,
  limit: 12,
  totalPages: 1,
  searchMode: 'exact',
  didYouMean: null,
};

const MOCK_FILTER_RESPONSE: FilterResponse = {
  categories: [{ name: 'Amber', slug: 'amber', count: 1 }],
  price: { min: 50, max: 500 },
  attributes: [],
};

const MOCK_AUTH_USER: User = {
  id: 'cust-101',
  email: 'nour.vip@example.com',
  firstName: 'Nour',
  lastName: 'Al-Mansoor',
  image: null,
  role: 'customer',
  isEmailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('E2E Simulated Customer Journey: Discovery to Purchase', () => {
  let router: Router;
  let mockStoreService: Partial<StoreService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockProductApi: Partial<ProductApiService>;
  let mockCartService: Partial<CartService>;
  let mockOrdersService: Partial<OrdersDataService>;
  let mockAuthService: Partial<AuthService>;
  let mockLocaleService: Partial<LocaleService>;

  // Hoisted to describe scope so the it() block can read them directly
  let cartItemsSignal: ReturnType<typeof signal<CartItem[]>>;
  let cartCountSignal: ReturnType<typeof signal<number>>;
  let cartSubtotalSignal: ReturnType<typeof signal<number>>;
  let cartTotalSignal: ReturnType<typeof signal<number>>;
  let lastOrderSignal: ReturnType<typeof signal<PlacedOrderResponse | null>>;

  beforeEach(() => {
    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockStoreService = {
      store: signal<StorePublic | null>(MOCK_STORE),
      displayName: signal('Layali Luxury Scents'),
      currency: signal('USD'),
      hero: signal(MOCK_STORE.hero),
      featuredCategories: signal(MOCK_STORE.featuredCategories),
      featuredProducts: signal(MOCK_STORE.featuredProducts),
      isLoading: signal(false),
      error: signal(null),
      load: vi.fn(),
      retry: vi.fn(),
    };

    mockProductApi = {
      getProducts: vi.fn().mockReturnValue(of(MOCK_CATALOG_RESPONSE)),
      getFilters: vi.fn().mockReturnValue(of(MOCK_FILTER_RESPONSE)),
      getProductBySlug: vi.fn().mockReturnValue(of(MOCK_PRODUCT_DETAIL)),
      getProductSuggestions: vi.fn().mockReturnValue(of([])),
    };

    cartItemsSignal = signal<CartItem[]>([]);
    cartCountSignal = signal(0);
    cartSubtotalSignal = signal(0);
    cartTotalSignal = signal(0);
    lastOrderSignal = signal<PlacedOrderResponse | null>(null);

    mockCartService = {
      items: cartItemsSignal,
      itemCount: cartCountSignal,
      subtotalAmount: cartSubtotalSignal,
      shippingFee: signal(15),
      totalAmount: cartTotalSignal,
      currency: signal('USD'),
      lastPlacedOrder: lastOrderSignal,
      prefilledCustomer: signal(null),
      addItem: vi.fn().mockImplementation((item) => {
        cartItemsSignal.update((list) => [...list, item]);
        cartCountSignal.update((c) => c + item.quantity);
        cartSubtotalSignal.update((sub) => sub + item.unitAmount * item.quantity);
        cartTotalSignal.update((tot) => tot + item.unitAmount * item.quantity + 15);
      }),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn().mockImplementation(() => {
        cartItemsSignal.set([]);
        cartCountSignal.set(0);
        cartSubtotalSignal.set(0);
        cartTotalSignal.set(0);
      }),
      clearPrefill: vi.fn(),
      setPrefilledCustomer: vi.fn(),
      setLastPlacedOrder: vi.fn().mockImplementation((ord) => lastOrderSignal.set(ord)),
      placeOrder: vi.fn().mockReturnValue(
        of({
          id: 'order-layali-999',
          orderNumber: 'ORD-LAYALI-999',
          totalAmount: 455,
          currency: 'USD',
          status: 'confirmed',
        }),
      ),
    };

    mockOrdersService = {
      getMyOrders: vi.fn().mockReturnValue(of({ items: [], total: 0 })),
      getMyOrder: vi.fn().mockReturnValue(of(null)),
      saveRecipientOverride: vi.fn(),
    };

    mockAuthService = {
      currentUser: signal<User | null>(MOCK_AUTH_USER),
      isAuthenticated: vi.fn().mockReturnValue(true),
      isLoggedIn: signal(true),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };
  });

  it('executes full simulated user purchase flow seamlessly', async () => {
    // ----------------------------------------------------
    // STAGE 1: Discovery on Storefront Landing Page (Home)
    // ----------------------------------------------------
    const homeFixture = TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).createComponent(Home);

    router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    homeFixture.detectChanges();
    const homeComponent = homeFixture.componentInstance;

    expect(homeComponent).toBeTruthy();
    const homeInternal = homeComponent as unknown as {
      storeName: () => string;
      hero: () => { headline: string };
      onAddToCart: (p: { id: string; slug: string }) => void;
    };
    expect(homeInternal.storeName()).toBe('Layali Luxury Scents');
    expect(homeInternal.hero().headline).toBe('Experience Pure Elegance');

    // Customer clicks on featured product "Royal Amber"
    homeInternal.onAddToCart({ id: 'royal-amber', slug: 'royal-amber' });
    expect(navSpy).toHaveBeenCalledWith(['/', 'layali', 'product-details', 'royal-amber']);

    homeFixture.destroy();

    // ----------------------------------------------------
    // STAGE 2: Product Catalog & Search Filtering
    // ----------------------------------------------------
    TestBed.resetTestingModule();
    const catalogFixture = TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        { provide: ProductApiService, useValue: mockProductApi },
        { provide: CartService, useValue: mockCartService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ category: 'amber' }),
            snapshot: { queryParams: { category: 'amber' } },
          },
        },
      ],
    }).createComponent(Products);

    catalogFixture.detectChanges();
    const catalogComponent = catalogFixture.componentInstance;

    expect(catalogComponent).toBeTruthy();
    expect(mockProductApi.getProducts).toHaveBeenCalled();
    expect(catalogComponent.productsResponse()?.items.length).toBe(1);
    expect(catalogComponent.productsResponse()?.items[0].title).toBe('Royal Amber EDP');

    // Customer toggles density to comfortable
    catalogComponent.density.set('comfortable');
    expect(catalogComponent.density()).toBe('comfortable');

    catalogFixture.destroy();

    // ----------------------------------------------------
    // STAGE 3: Product Detail, Variant Selection & Add To Cart
    // ----------------------------------------------------
    TestBed.resetTestingModule();
    const detailsFixture = TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        ProductStore,
        { provide: ProductApiService, useValue: mockProductApi },
        { provide: CartService, useValue: mockCartService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'royal-amber' } },
            paramMap: of({ get: () => 'royal-amber' }),
          },
        },
      ],
    }).createComponent(ProductDetails);

    detailsFixture.detectChanges();
    const detailsComponent = detailsFixture.componentInstance;

    expect(detailsComponent).toBeTruthy();
    expect(mockProductApi.getProductBySlug).toHaveBeenCalledWith('layali', 'royal-amber');

    // Customer interacts with product store: selects 100ml variant and quantity of 2
    const detailsInternal = detailsComponent as unknown as {
      store: ProductStore;
      addStickyToCart: (e: MouseEvent) => void;
    };
    detailsInternal.store.loadProduct(MOCK_PRODUCT_DETAIL);
    detailsInternal.store.selectOption('size', '100ml');
    detailsInternal.store.increment(); // quantity = 2

    expect(detailsInternal.store.currentVariant()?.id).toBe('var-amber-100ml');
    expect(detailsInternal.store.quantity()).toBe(2);

    // Customer adds to cart
    const dummyBtn = document.createElement('button');
    detailsInternal.addStickyToCart({ currentTarget: dummyBtn } as unknown as MouseEvent);

    expect(mockCartService.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'var-amber-100ml',
        productSlug: 'royal-amber',
        unitAmount: 220,
        quantity: 2,
      }),
    );

    // Verify cart updated via the writable signal implementations
    expect(cartCountSignal()).toBe(2);
    expect(cartSubtotalSignal()).toBe(440);
    expect(cartTotalSignal()).toBe(455);

    detailsFixture.destroy();

    // ----------------------------------------------------
    // STAGE 4: Checkout Navigation, Form Validation & Submission
    // ----------------------------------------------------
    TestBed.resetTestingModule();
    const checkoutFixture = TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        { provide: CartService, useValue: mockCartService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OrdersDataService, useValue: mockOrdersService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'layali' } },
          },
        },
      ],
    }).createComponent(Checkout);

    const checkoutRouter = TestBed.inject(Router);
    const checkoutNavSpy = vi
      .spyOn(checkoutRouter, 'navigate')
      .mockImplementation(async () => true);

    checkoutFixture.detectChanges();
    const checkoutComponent = checkoutFixture.componentInstance;

    expect(checkoutComponent).toBeTruthy();
    // Customer profile prefilled from authenticated session
    expect(checkoutComponent.checkoutForm.get('firstName')?.value).toBe('Nour');
    expect(checkoutComponent.checkoutForm.get('lastName')?.value).toBe('Al-Mansoor');

    // Step 1: Customer completes contact phone
    checkoutComponent.checkoutForm.patchValue({
      contactPhone: '+201009988776',
    });
    expect(checkoutComponent.isStep1Valid()).toBe(true);

    // Step 2: Customer enters shipping address
    checkoutComponent.checkoutForm.patchValue({
      line1: '10 Corniche Road',
      city: 'Alexandria',
      country: 'EG',
    });
    expect(checkoutComponent.isStep2Valid()).toBe(true);

    // Step 3: Apply promo coupon
    checkoutComponent.promoCodeInput.set('VIP10');
    checkoutComponent.applyPromoCode();
    expect(checkoutComponent.isPromoApplied()).toBe(true);

    // Final Action: Customer places order
    checkoutComponent.onSubmit();

    expect(mockCartService.placeOrder).toHaveBeenCalledWith(
      'layali',
      expect.objectContaining({
        contactPhone: '+201009988776',
        paymentMethod: 'cod',
        shippingAddress: expect.objectContaining({
          line1: '10 Corniche Road',
          city: 'Alexandria',
          country: 'EG',
        }),
      }),
    );

    // Post-purchase cleanup and confirmation route transition
    expect(mockCartService.clearCart).toHaveBeenCalled();
    expect(mockCartService.setLastPlacedOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: 'ORD-LAYALI-999',
      }),
    );
    expect(checkoutNavSpy).toHaveBeenCalledWith(['/', 'layali', 'order-confirmed'], {
      queryParams: { orderNumber: 'ORD-LAYALI-999' },
    });

    checkoutFixture.destroy();
  });
});
