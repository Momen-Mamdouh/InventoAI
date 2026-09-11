import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { ExistingStore } from '@invento/site-builder-feature-home';
import { hasNoStoreGuard } from '../../guards/has-no-store.guard';
import { StoreApi } from '@invento/site-builder-data-access-builder';
import { AuthService } from '@invento/shared-data-access-auth';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from 'ngx-sonner';
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
Element.prototype.scrollIntoView = vi.fn();

describe('E2E Journey: Existing Store Guard Interception and Dashboard SSO', () => {
  let authServiceMock: {
    currentUser: ReturnType<
      typeof signal<{ id: string; name?: string; storeSlug?: string } | null>
    >;
    getStoreSlug: ReturnType<typeof vi.fn>;
    getSsoUrl: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof signal<boolean>>;
  };
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');

    authServiceMock = {
      currentUser: signal<{
        id: string;
        firstName?: string;
        name?: string;
        storeSlug?: string;
      } | null>({
        id: 'owner-99',
        firstName: 'Jane Doe',
        name: 'Jane Doe',
        storeSlug: 'jane-boutique',
      }),
      getStoreSlug: vi.fn().mockReturnValue('jane-boutique'),
      getSsoUrl: vi.fn(
        (dashUrl: string, path: string) => `${dashUrl}/sso?target=${encodeURIComponent(path)}`,
      ),
      isAuthenticated: signal(true),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `trans_${k}`),
    };

    const storeApiMock = {
      getMyStore: vi
        .fn()
        .mockReturnValue(of({ status: 'live', name: 'Jane Boutique', slug: 'jane-boutique' })),
    };

    await TestBed.configureTestingModule({
      imports: [ExistingStore, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: StoreApi, useValue: storeApiMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ApiConfig,
          useValue: {
            dashboardUrl: 'https://dashboard.invento.ai',
            storefrontUrl: 'https://invento.shop',
          },
        },
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: true,
            apiUrl: 'https://api.invento.ai',
            dashboardUrl: 'https://dashboard.invento.ai',
          },
        },
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    toastInfoSpy.mockRestore();
  });

  it('intercepts navigation to /build and redirects to /home when user owns an active store', () => {
    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/build' } as RouterStateSnapshot;

    const result$ = TestBed.runInInjectionContext(() => hasNoStoreGuard(dummyRoute, dummyState));
    (result$ as Observable<boolean | UrlTree>).subscribe((val: boolean | UrlTree) => {
      expect(val.toString()).toContain('/home');
    });
    expect(toastInfoSpy).toHaveBeenCalledWith('trans_toast_has_existing_store', {
      id: 'existing-store-guard-toast',
    });
  });

  it('renders ExistingStore with store information and SSO dashboard links', () => {
    const fixture: ComponentFixture<ExistingStore> = TestBed.createComponent(ExistingStore);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.ownerName()).toBe('Jane Doe');
    expect(comp.storeSlug()).toBe('jane-boutique');
    expect(comp.storefrontUrl()).toContain('https://jane-boutique.invento.site');
    expect(comp.dashboardUrl()).toContain('https://dashboard.invento.ai');
    expect(comp.catalogUrl()).toContain('https://dashboard.invento.ai');
    expect(comp.ordersUrl()).toContain('https://dashboard.invento.ai');
    expect(comp.advisorUrl()).toContain('https://dashboard.invento.ai');
  });
});
