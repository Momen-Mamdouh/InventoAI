import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, firstValueFrom, throwError } from 'rxjs';
import { Home, homeResolver } from '@invento/site-builder-feature-home';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { BuilderState, HydrationOutcome } from '@invento/site-builder-data-access-builder';
import { SITE_BUILDER_ENVIRONMENT, ApiConfig } from '@invento/site-builder-data-access-preview';
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

describe('Home Component and Resolver Integration', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let builderState: BuilderState;
  let isLoggedInSignal: ReturnType<typeof signal<boolean>>;
  let currentUserSignal: ReturnType<typeof signal<User | null>>;
  let storeSlugSignal: ReturnType<typeof signal<string | null>>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    isLoggedInSignal = signal(false);
    currentUserSignal = signal<User | null>(null);
    storeSlugSignal = signal<string | null>(null);

    const mockAuthService = {
      isLoggedIn: isLoggedInSignal,
      currentUser: currentUserSignal,
      getStoreSlug: storeSlugSignal,
      getSsoUrl: vi.fn((base: string, path: string) => `${base}${path}`),
      isAuthenticated: vi.fn().mockReturnValue(false),
      logout: vi.fn(),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    await TestBed.configureTestingModule({
      imports: [Home, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        ApiConfig,
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000',
            dashboardUrl: 'http://localhost:4200',
          },
        },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    builderState = TestBed.inject(BuilderState);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the home component', () => {
    expect(component).toBeTruthy();
  });

  describe('hasExistingStore computed', () => {
    it('returns false when user is not logged in', () => {
      isLoggedInSignal.set(false);
      builderState.hasLiveStore.set(true);
      fixture.detectChanges();

      expect(component.hasExistingStore()).toBe(false);
    });

    it('returns true when user is logged in and builderState has a live store', () => {
      isLoggedInSignal.set(true);
      builderState.hasLiveStore.set(true);
      fixture.detectChanges();

      expect(component.hasExistingStore()).toBe(true);
    });

    it('returns true when user is logged in and user profile contains storeSlug', () => {
      isLoggedInSignal.set(true);
      builderState.hasLiveStore.set(false);
      currentUserSignal.set({
        id: 'usr-1',
        email: 'test@example.com',
        storeSlug: 'my-active-store',
      } as unknown as User);
      fixture.detectChanges();

      expect(component.hasExistingStore()).toBe(true);
    });

    it('returns true when user is logged in and getStoreSlug returns a slug', () => {
      isLoggedInSignal.set(true);
      builderState.hasLiveStore.set(false);
      currentUserSignal.set(null);
      storeSlugSignal.set('fallback-slug');
      fixture.detectChanges();

      expect(component.hasExistingStore()).toBe(true);
    });
  });

  describe('ngOnInit hydration', () => {
    const defaultOutcome: HydrationOutcome = {
      hasLiveStore: false,
      isThemed: false,
      isDomainConfirmed: false,
      isAiInterviewComplete: false,
      isBrainstormComplete: false,
    };

    it('triggers hydrateFromBackend when logged in and not yet hydrated', () => {
      isLoggedInSignal.set(true);
      builderState.isHydrated.set(false);
      const hydrateSpy = vi
        .spyOn(builderState, 'hydrateFromBackend')
        .mockReturnValue(of(defaultOutcome));

      component.ngOnInit();

      expect(hydrateSpy).toHaveBeenCalled();
    });

    it('does not trigger hydrateFromBackend if already hydrated', () => {
      isLoggedInSignal.set(true);
      builderState.isHydrated.set(true);
      const hydrateSpy = vi.spyOn(builderState, 'hydrateFromBackend');

      component.ngOnInit();

      expect(hydrateSpy).not.toHaveBeenCalled();
    });

    it('does not trigger hydrateFromBackend if not logged in', () => {
      isLoggedInSignal.set(false);
      builderState.isHydrated.set(false);
      const hydrateSpy = vi.spyOn(builderState, 'hydrateFromBackend');

      component.ngOnInit();

      expect(hydrateSpy).not.toHaveBeenCalled();
    });
  });

  describe('homeResolver', () => {
    const defaultOutcome: HydrationOutcome = {
      hasLiveStore: false,
      isThemed: false,
      isDomainConfirmed: false,
      isAiInterviewComplete: false,
      isBrainstormComplete: false,
    };

    it('returns of(true) immediately if user is not logged in', async () => {
      isLoggedInSignal.set(false);
      builderState.isHydrated.set(false);

      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() => homeResolver({} as never, {} as never) as never),
      );
      expect(result).toBe(true);
    });

    it('returns of(true) immediately if already hydrated', async () => {
      isLoggedInSignal.set(true);
      builderState.isHydrated.set(true);

      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() => homeResolver({} as never, {} as never) as never),
      );
      expect(result).toBe(true);
    });

    it('hydrates and maps to true when logged in and not hydrated', async () => {
      isLoggedInSignal.set(true);
      builderState.isHydrated.set(false);
      vi.spyOn(builderState, 'hydrateFromBackend').mockReturnValue(of(defaultOutcome));

      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() => homeResolver({} as never, {} as never) as never),
      );
      expect(result).toBe(true);
    });

    it('catches hydration errors and resolves to true gracefully', async () => {
      isLoggedInSignal.set(true);
      builderState.isHydrated.set(false);
      vi.spyOn(builderState, 'hydrateFromBackend').mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() => homeResolver({} as never, {} as never) as never),
      );
      expect(result).toBe(true);
    });
  });
});
