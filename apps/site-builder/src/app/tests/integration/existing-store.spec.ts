import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ExistingStore } from '@invento/site-builder-feature-home';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { BuilderState } from '@invento/site-builder-data-access-builder';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { LocaleService } from '@invento/shared-util-i18n';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockObserver,
  configurable: true,
});
Object.defineProperty(globalThis, 'ResizeObserver', { value: MockObserver, configurable: true });

describe('ExistingStore Component Integration', () => {
  let fixture: ComponentFixture<ExistingStore>;
  let component: ExistingStore;
  let builderState: BuilderState;
  let currentUserSignal: ReturnType<typeof signal<User | null>>;
  let storeSlugSignal: ReturnType<typeof signal<string | null>>;
  let isRtlSignal: ReturnType<typeof signal<boolean>>;
  let envMock: { production: boolean; apiUrl: string; dashboardUrl: string };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    currentUserSignal = signal<User | null>(null);
    storeSlugSignal = signal<string | null>(null);
    isRtlSignal = signal(false);
    envMock = {
      production: false,
      apiUrl: 'http://localhost:3000',
      dashboardUrl: 'http://localhost:4200/home',
    };

    const mockAuthService = {
      currentUser: currentUserSignal,
      getStoreSlug: storeSlugSignal,
      getSsoUrl: vi.fn(
        (baseUrl: string, targetPath: string) => `${baseUrl}/sso?returnUrl=${targetPath}`,
      ),
      logout: vi.fn(),
      isLoggedIn: signal(true),
    };

    const mockLocaleService = {
      isRtl: isRtlSignal,
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    await TestBed.configureTestingModule({
      imports: [ExistingStore, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        ApiConfig,
        { provide: SITE_BUILDER_ENVIRONMENT, useValue: envMock },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExistingStore);
    component = fixture.componentInstance;
    builderState = TestBed.inject(BuilderState);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the existing store component', () => {
    expect(component).toBeTruthy();
  });

  describe('ownerName and storeSlug computation', () => {
    it('computes ownerName from currentUser first, falling back to businessName', () => {
      builderState.businessName.set('Fallback Brand');
      expect(component.ownerName()).toBe('Fallback Brand');

      currentUserSignal.set({
        id: 'usr-1',
        firstName: 'Alice',
      } as unknown as User);
      expect(component.ownerName()).toBe('Alice');
    });

    it('computes storeSlug from builderState.domain first, then currentUser, then getStoreSlug', () => {
      storeSlugSignal.set('slug-from-token');
      expect(component.storeSlug()).toBe('slug-from-token');

      currentUserSignal.set({
        id: 'usr-1',
        storeSlug: 'slug-from-user',
      } as unknown as User);
      expect(component.storeSlug()).toBe('slug-from-user');

      builderState.domain.set('slug-from-state');
      expect(component.storeSlug()).toBe('slug-from-state');
    });
  });

  describe('Dashboard and Microservice SSO URLs', () => {
    it('computes valid URLs for dashboard, products, orders, and ai-advisor', () => {
      builderState.domain.set('my-boutique');

      expect(component.dashboardUrl()).toContain('/sso?returnUrl=/home');
      expect(component.catalogUrl()).toContain('/sso?returnUrl=/products');
      expect(component.ordersUrl()).toContain('/sso?returnUrl=/orders');
      expect(component.advisorUrl()).toContain('/sso?returnUrl=/ai-advisor');
    });
  });

  describe('Storefront URL resolution', () => {
    it('returns empty string if storeSlug is empty', () => {
      builderState.domain.set('');
      currentUserSignal.set(null);
      storeSlugSignal.set(null);

      expect(component.storefrontUrl()).toBe('');
    });

    it('generates localhost URL in development environment', () => {
      builderState.domain.set('organic-co');
      expect(component.storefrontUrl()).toBe('http://localhost:4300/organic-co');
    });

    it('generates invento.site subdomain in production environment', () => {
      envMock.production = true;
      builderState.domain.set('organic-co');
      expect(component.storefrontUrl()).toBe('https://organic-co.invento.site');
    });
  });
});
