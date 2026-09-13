import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { signal, PLATFORM_ID } from '@angular/core';
import { of, Observable } from 'rxjs';
import { Home } from '@invento/user-site-feature-home';
import { Products } from '@invento/user-site-feature-product';
import { StoreService, StoreSlugService, StorePublic } from '@invento/user-site-data-access-store';
import {
  ProductApiService,
  ProductListResponse,
  FilterResponse,
} from '@invento/user-site-data-access-product';
import { LocaleService } from '@invento/shared-util-i18n';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '@invento/user-site-data-access-cart';

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

const MOCK_STORE: StorePublic = {
  name: 'Layali Fragrances',
  slug: 'layali',
  description: 'Pure Oud & Rose',
  logoUrl: 'https://example.com/logo.png',
  logoSource: 'uploaded',
  locale: 'en',
  currency: 'USD',
  hero: {
    imageUrl: 'https://example.com/hero.jpg',
    headline: 'Welcome to Layali',
    subtitle: 'Sensory perfumes',
    ctaLabel: 'Browse Scents',
    ctaHref: '/layali/products',
  },
  theme: null,
  featuredCategories: [
    {
      name: 'Oud Oils',
      slug: 'oud-oils',
      description: 'Concentrated',
      imageUrl: null,
      productCount: 5,
    },
  ],
  featuredProducts: [
    {
      title: 'Royal Dehn',
      slug: 'royal-dehn',
      shortDescription: 'Aged 20 years',
      imageUrl: 'https://example.com/dehn.jpg',
      imageAltText: 'Bottle of Royal Dehn',
      categories: [],
      minPriceAmount: 250,
      maxPriceAmount: 300,
      inStock: true,
      swatches: [],
    },
  ],
};

const MOCK_PRODUCTS_RESPONSE: ProductListResponse = {
  items: [
    {
      title: 'Musk Tahara',
      slug: 'musk-tahara',
      shortDescription: 'White musk',
      minPriceAmount: 45,
      maxPriceAmount: 45,
      imageUrl: 'https://example.com/musk.jpg',
      imageAltText: 'Musk',
      categories: [
        { name: 'Musk', slug: 'musk', description: '', imageUrl: null, productCount: 1 },
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

const MOCK_FILTERS_RESPONSE: FilterResponse = {
  categories: [
    { name: 'Musk', slug: 'musk', count: 4 },
    { name: 'Oud', slug: 'oud', count: 8 },
  ],
  price: { min: 20, max: 500 },
  attributes: [],
};

interface HomeInternalAccess {
  storeName: () => string;
  storeDescription: () => string;
  storeCurrency: () => string;
  hero: () => unknown;
  onAddToCart: (product: { id: string; slug: string }) => void;
  retry: () => void;
}

describe('Home and Catalog Integration Tests', () => {
  let mockStoreService: Partial<StoreService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(() => {
    mockStoreService = {
      store: signal<StorePublic | null>(MOCK_STORE),
      displayName: signal('Layali Fragrances'),
      currency: signal('USD'),
      hero: signal(MOCK_STORE.hero),
      featuredCategories: signal(MOCK_STORE.featuredCategories),
      featuredProducts: signal(MOCK_STORE.featuredProducts),
      isLoading: signal(false),
      error: signal(null),
      load: vi.fn(),
      retry: vi.fn(),
    };

    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((key: string) => key),
    };
  });

  describe('Home Component', () => {
    let fixture: ComponentFixture<Home>;
    let component: Home;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Home],
        providers: [
          provideRouter([]),
          { provide: StoreService, useValue: mockStoreService },
          { provide: StoreSlugService, useValue: mockStoreSlugService },
          { provide: LocaleService, useValue: mockLocaleService },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockImplementation(async () => true);

      fixture = TestBed.createComponent(Home);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates Home component and binds store signals', () => {
      expect(component).toBeTruthy();
      const internal = component as unknown as HomeInternalAccess;
      expect(internal.storeName()).toBe('Layali Fragrances');
      expect(internal.storeDescription()).toBe('Pure Oud & Rose');
      expect(internal.storeCurrency()).toBe('USD');
      expect(internal.hero()).toEqual(MOCK_STORE.hero);
    });

    it('navigates to product details on onAddToCart()', () => {
      (component as unknown as HomeInternalAccess).onAddToCart({
        id: 'royal-dehn',
        slug: 'royal-dehn',
      });
      expect(router.navigate).toHaveBeenCalledWith([
        '/',
        'layali',
        'product-details',
        'royal-dehn',
      ]);
    });

    it('invokes storeService.retry() on retry action', () => {
      (component as unknown as HomeInternalAccess).retry();
      expect(mockStoreService.retry).toHaveBeenCalledWith('layali');
    });
  });

  describe('Products Catalog Component', () => {
    let fixture: ComponentFixture<Products>;
    let component: Products;
    let mockProductApi: Partial<ProductApiService>;
    let mockCartService: Partial<CartService>;
    let activatedRouteParams$: Observable<{ category: string }>;
    let router: Router;

    beforeEach(async () => {
      activatedRouteParams$ = of({ category: 'musk' });
      mockProductApi = {
        getProducts: vi.fn().mockReturnValue(of(MOCK_PRODUCTS_RESPONSE)),
        getFilters: vi.fn().mockReturnValue(of(MOCK_FILTERS_RESPONSE)),
        getProductSuggestions: vi.fn().mockReturnValue(of([])),
      };

      mockCartService = {
        addItem: vi.fn(),
        itemCount: signal(0),
        items: signal([]),
      };

      await TestBed.configureTestingModule({
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
              queryParams: activatedRouteParams$,
              snapshot: { queryParams: { category: 'musk' } },
            },
          },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockImplementation(async () => true);

      fixture = TestBed.createComponent(Products);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates Products catalog component and fetches product catalog', () => {
      expect(component).toBeTruthy();
      expect(mockProductApi.getProducts).toHaveBeenCalled();
      expect(mockProductApi.getFilters).toHaveBeenCalled();
    });

    it('computes active category from query params and filter metadata', () => {
      component.filterResponse.set(MOCK_FILTERS_RESPONSE);
      component.currentParams.set({ category: 'musk' });

      expect(component.selectedCategorySlug()).toBe('musk');
      expect(component.activeCategoryName()).toBe('Musk');
      expect(component.categories().length).toBe(2);
    });

    it('updates density state when toggled between comfortable and compact', () => {
      expect(component.density()).toBe('comfortable');
      component.density.set('compact');
      expect(component.density()).toBe('compact');
    });

    it('toggles mobile filter drawer state', () => {
      expect(component.isMobileFilterOpen()).toBe(false);
      component.isMobileFilterOpen.set(true);
      expect(component.isMobileFilterOpen()).toBe(true);
    });
  });
});
