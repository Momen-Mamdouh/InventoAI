import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { Navbar, Footer, StoreLoader } from '@invento/user-site-feature-storefront';
import {
  StoreService,
  StoreSlugService,
  StoreLoaderService,
  StorePublic,
} from '@invento/user-site-data-access-store';
import { CartService } from '@invento/user-site-data-access-cart';
import { AuthService } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';

const MOCK_STORE: StorePublic = {
  name: 'Layali Perfumes',
  slug: 'layali',
  description: 'Luxury Arabian Scents',
  logoUrl: 'https://example.com/logo.png',
  logoSource: 'uploaded',
  locale: 'en',
  currency: 'USD',
  contactEmail: 'contact@layali.com',
  hero: {
    imageUrl: 'https://example.com/hero.png',
    headline: 'Arabian Magic',
    subtitle: 'Finest Scents',
    ctaLabel: 'Shop Now',
    ctaHref: '/layali/products',
  },
  theme: null,
  featuredCategories: [],
  featuredProducts: [],
  social: {
    facebook: 'https://facebook.com/layali',
    instagram: 'https://instagram.com/layali',
    twitter: null,
  },
};

interface NavbarInternalAccess {
  links: () => { labelKey: string; path: string }[];
  cartCount: () => number;
  cartBadge: () => string;
  logout: () => void;
}

interface FooterInternalAccess {
  year: number;
  hasSocialLinks: () => boolean;
}

interface StoreLoaderInternalAccess {
  storeName: () => string;
  logoUrl: () => string | null;
  monogram: () => string;
  hasStoreContext: () => boolean;
}

interface MockStoreService {
  store: WritableSignal<StorePublic | null>;
  displayName: WritableSignal<string>;
  logoUrl: WritableSignal<string | null>;
  monogram: WritableSignal<string>;
  contactEmail: WritableSignal<string | null>;
  social: WritableSignal<StorePublic['social']>;
  load: ReturnType<typeof vi.fn>;
}

interface MockCartService {
  itemCount: WritableSignal<number>;
  items: WritableSignal<unknown[]>;
}

describe('Storefront Chrome Integration Tests', () => {
  let mockStoreService: MockStoreService;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockCartService: MockCartService;
  let mockAuthService: Partial<AuthService>;
  let mockLocaleService: Partial<LocaleService>;
  let mockThemeService: Partial<ThemeService>;
  let mockLoaderService: Partial<StoreLoaderService>;

  beforeEach(() => {
    mockStoreService = {
      store: signal<StorePublic | null>(MOCK_STORE),
      displayName: signal('Layali Perfumes'),
      logoUrl: signal('https://example.com/logo.png'),
      monogram: signal('LP'),
      contactEmail: signal('contact@layali.com'),
      social: signal(MOCK_STORE.social),
      load: vi.fn(),
    };

    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockCartService = {
      itemCount: signal(3),
      items: signal([]),
    };

    mockAuthService = {
      currentUser: signal(null),
      isAuthenticated: signal(false),
      isLoggedIn: signal(false),
      logout: vi.fn(),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((key: string) => key),
    };

    mockThemeService = {
      isDark: signal(false),
      theme: signal('light'),
      setTheme: vi.fn(),
    };

    mockLoaderService = {
      isLoading: signal(false),
      isInitialSplash: signal(false),
      progress: signal(0),
      statusKey: signal('store_loader.loading'),
    };
  });

  describe('Navbar Component', () => {
    let fixture: ComponentFixture<Navbar>;
    let component: Navbar;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Navbar],
        providers: [
          provideRouter([]),
          { provide: StoreService, useValue: mockStoreService },
          { provide: StoreSlugService, useValue: mockStoreSlugService },
          { provide: CartService, useValue: mockCartService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: LocaleService, useValue: mockLocaleService },
          { provide: ThemeService, useValue: mockThemeService },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockImplementation(async () => true);

      fixture = TestBed.createComponent(Navbar);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates the navbar component and loads store for active slug', () => {
      expect(component).toBeTruthy();
      expect(mockStoreService.load).toHaveBeenCalledWith('layali');
    });

    it('computes navigation links with active slug prefix', () => {
      const internal = component as unknown as NavbarInternalAccess;
      const links = internal.links();
      expect(links).toEqual([
        { labelKey: 'nav.home', path: '/layali' },
        { labelKey: 'nav.shop', path: '/layali/products' },
        { labelKey: 'nav.orders', path: '/layali/orders' },
        { labelKey: 'nav.faq', path: '/layali/faq' },
      ]);
    });

    it('computes cart count and badge formatting properly', () => {
      const internal = component as unknown as NavbarInternalAccess;
      expect(internal.cartCount()).toBe(3);
      expect(internal.cartBadge()).toBe('3');

      mockCartService.itemCount.set(120);
      expect(internal.cartBadge()).toBe('99+');
    });

    it('toggles isScrolled signal on window scroll events', () => {
      expect(component.isScrolled()).toBe(false);

      // Simulate window scroll
      Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
      component.onWindowScroll();
      expect(component.isScrolled()).toBe(true);

      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
      component.onWindowScroll();
      expect(component.isScrolled()).toBe(false);
    });

    it('logs out and redirects to storefront landing page when logout() is invoked', () => {
      (component as unknown as NavbarInternalAccess).logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/', 'layali']);
    });
  });

  describe('Footer Component', () => {
    let fixture: ComponentFixture<Footer>;
    let component: Footer;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Footer],
        providers: [
          provideRouter([]),
          { provide: StoreService, useValue: mockStoreService },
          { provide: StoreSlugService, useValue: mockStoreSlugService },
          { provide: LocaleService, useValue: mockLocaleService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Footer);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates the footer and sets current year', () => {
      expect(component).toBeTruthy();
      expect((component as unknown as FooterInternalAccess).year).toBe(new Date().getFullYear());
    });

    it('detects social links or contact email presence', () => {
      const internal = component as unknown as FooterInternalAccess;
      expect(internal.hasSocialLinks()).toBe(true);

      mockStoreService.social.set(null);
      mockStoreService.contactEmail.set(null);
      expect(internal.hasSocialLinks()).toBe(false);
    });

    it('toggles showBackToTop button based on scroll threshold', () => {
      expect(component.showBackToTop()).toBe(false);

      Object.defineProperty(window, 'scrollY', { value: 300, writable: true });
      component.onWindowScroll();
      expect(component.showBackToTop()).toBe(true);
    });
  });

  describe('StoreLoader Component', () => {
    let fixture: ComponentFixture<StoreLoader>;
    let component: StoreLoader;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StoreLoader],
        providers: [
          { provide: StoreLoaderService, useValue: mockLoaderService },
          { provide: StoreService, useValue: mockStoreService },
          { provide: StoreSlugService, useValue: mockStoreSlugService },
          { provide: LocaleService, useValue: mockLocaleService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(StoreLoader);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates the store loader component and binds store branding', () => {
      expect(component).toBeTruthy();
      const internal = component as unknown as StoreLoaderInternalAccess;
      expect(internal.storeName()).toBe('Layali Perfumes');
      expect(internal.logoUrl()).toBe('https://example.com/logo.png');
      expect(internal.monogram()).toBe('LP');
      expect(internal.hasStoreContext()).toBe(true);
    });

    it('falls back to capitalized slug and default initials if store metadata is empty', () => {
      mockStoreService.displayName.set('');
      mockStoreService.logoUrl.set(null);
      mockStoreService.monogram.set('');

      const internal = component as unknown as StoreLoaderInternalAccess;
      expect(internal.storeName()).toBe('Layali');
      expect(internal.monogram()).toBe('LA');
    });
  });
});
