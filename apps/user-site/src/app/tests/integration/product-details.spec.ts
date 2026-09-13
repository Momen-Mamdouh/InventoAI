import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ProductDetails } from '@invento/user-site-feature-product';
import {
  ProductApiService,
  ProductDetail,
  ProductStore,
} from '@invento/user-site-data-access-product';
import { CartService } from '@invento/user-site-data-access-cart';
import { StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';
import { CurrencyPipe } from '@angular/common';

const MOCK_PRODUCT = {
  id: 'prod-amber',
  slug: 'royal-amber',
  title: 'Royal Amber EDP',
  description: 'Sensational oriental perfume with notes of sweet amber and cedar.',
  shortDescription: 'Sweet oriental perfume',
  price: 180,
  minPriceAmount: 180,
  maxPriceAmount: 220,
  currency: 'USD',
  inStock: true,
  images: [
    { url: 'https://example.com/amber1.jpg', altText: 'Front bottle' },
    { url: 'https://example.com/amber2.jpg', altText: 'Box presentation' },
  ],
  categories: [{ id: 'c1', name: 'Amber', slug: 'amber' }],
  variants: [
    {
      id: 'var-50ml',
      price: 180,
      priceAmount: 180,
      inStock: true,
      stockLeft: 10,
      options: [{ attributeKey: 'size', attributeName: 'Size', value: '50ml', slug: '50ml' }],
    },
    {
      id: 'var-100ml',
      price: 220,
      priceAmount: 220,
      inStock: true,
      stockLeft: 5,
      options: [{ attributeKey: 'size', attributeName: 'Size', value: '100ml', slug: '100ml' }],
    },
  ],
  swatches: [],
} as unknown as ProductDetail;

describe('ProductDetails Integration Tests', () => {
  let fixture: ComponentFixture<ProductDetails>;
  let component: ProductDetails;
  let mockProductApi: {
    getProductBySlug: ReturnType<typeof vi.fn>;
    getProducts: ReturnType<typeof vi.fn>;
  };
  let mockCartService: Partial<CartService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(async () => {
    mockProductApi = {
      getProductBySlug: vi.fn().mockReturnValue(of(MOCK_PRODUCT)),
      getProducts: vi
        .fn()
        .mockReturnValue(of({ items: [], total: 0, page: 1, limit: 12, totalPages: 1 })),
    };

    mockCartService = {
      addItem: vi.fn(),
      itemCount: signal(0),
    };

    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        { provide: ProductApiService, useValue: mockProductApi },
        { provide: CartService, useValue: mockCartService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => (key === 'id' ? 'royal-amber' : null) }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates ProductDetails component and resolves product by slug', () => {
    expect(component).toBeTruthy();
    expect(mockProductApi.getProductBySlug).toHaveBeenCalledWith('layali', 'royal-amber');
    expect(component.isLoading()).toBe(false);
    expect(component.notFound()).toBe(false);
  });

  it('sets notFound signal when product API returns 404 or null', () => {
    mockProductApi.getProductBySlug.mockReturnValue(of(null));
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.notFound()).toBe(true);
  });

  it('adds item to cart with selected variant and quantity when addStickyToCart is triggered', () => {
    // Populate store state
    const internal = component as unknown as {
      store: ProductStore;
      addStickyToCart: (e: MouseEvent) => void;
    };
    internal.store.loadProduct(MOCK_PRODUCT);
    internal.store.increment();

    const dummyEvent = {
      currentTarget: document.createElement('button'),
    } as unknown as MouseEvent;

    internal.addStickyToCart(dummyEvent);

    expect(mockCartService.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'var-50ml',
        productSlug: 'royal-amber',
        unitAmount: 180,
        quantity: 2,
      }),
    );
  });
});
