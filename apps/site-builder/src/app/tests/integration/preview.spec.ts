import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Preview } from '@invento/site-builder-feature-builder';
import {
  PreviewDataClient,
  BuilderState,
  PublishApi,
} from '@invento/site-builder-data-access-builder';
import { ThemeSuggestion } from '@invento/shared-util-preview-types';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { AuthService } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';
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

const MOCK_THEME: ThemeSuggestion = {
  id: 'theme-1',
  name: 'Modern Clean',
  description: 'Clean minimalist look',
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#10b981',
    primaryForeground: '#ffffff',
    secondary: '#f3f4f6',
    secondaryForeground: '#111827',
    accent: '#3b82f6',
    border: '#e5e7eb',
    ring: '#10b981',
    destructive: '#ef4444',
  },
  darkColors: {
    background: '#121212',
    foreground: '#ffffff',
    primary: '#10b981',
    primaryForeground: '#000000',
    secondary: '#1e1e1e',
    secondaryForeground: '#f9fafb',
    accent: '#60a5fa',
    border: '#27272a',
    ring: '#10b981',
    destructive: '#f87171',
  },
  radius: '0.5rem',
};

describe('Preview Component Integration', () => {
  let fixture: ComponentFixture<Preview>;
  let component: Preview;
  let builderState: BuilderState;
  let publishApiMock: { publishSite: ReturnType<typeof vi.fn> };
  let previewDataClientMock: {
    themeSuggestions: ReturnType<typeof signal<ThemeSuggestion[]>>;
    products: ReturnType<
      typeof signal<{ id: string; name: string; price: number; image: string }[]>
    >;
    navTabs: ReturnType<typeof signal<{ id: string; label: string }[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    loaded: ReturnType<typeof signal<boolean>>;
    themeError: ReturnType<typeof signal<string | null>>;
    themesUnavailable: ReturnType<typeof signal<boolean>>;
    loadThemes: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<{ id: string; storeSlug?: string } | null>>;
    getSsoUrl: ReturnType<typeof vi.fn>;
  };
  let toastErrorSpy: ReturnType<typeof vi.spyOn>;
  let toastSuccessSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '');
    toastSuccessSpy = vi.spyOn(toast, 'success').mockImplementation(() => '');

    publishApiMock = {
      publishSite: vi.fn().mockReturnValue(of({ success: true, slug: 'aurora-store' })),
    };

    previewDataClientMock = {
      themeSuggestions: signal<ThemeSuggestion[]>([MOCK_THEME]),
      products: signal([
        { id: 'p1', name: 'Signature Handbag', price: 120, image: 'https://img.com/p1.png' },
      ]),
      navTabs: signal([
        { id: 'home', label: 'Home' },
        { id: 'catalog', label: 'Catalog' },
      ]),
      isLoading: signal(false),
      loaded: signal(true),
      themeError: signal<string | null>(null),
      themesUnavailable: signal(false),
      loadThemes: vi.fn(),
      reload: vi.fn(),
    };

    authServiceMock = {
      currentUser: signal<{ id: string; storeSlug?: string } | null>({ id: 'user-1' }),
      getSsoUrl: vi.fn().mockReturnValue('http://localhost:4200/sso-redirect'),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `trans_${k}`),
    };

    await TestBed.configureTestingModule({
      imports: [Preview, HttpClientTestingModule],
      providers: [
        BuilderState,
        { provide: PublishApi, useValue: publishApiMock },
        { provide: PreviewDataClient, useValue: previewDataClientMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ApiConfig,
          useValue: {
            dashboardUrl: 'http://localhost:4200',
            storefrontUrl: 'http://localhost:4300',
          },
        },
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000',
            dashboardUrl: 'http://localhost:4200',
          },
        },
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    builderState = TestBed.inject(BuilderState);
    builderState.businessName.set('Aurora Boutique');
    builderState.domain.set('aurora-boutique');

    fixture = TestBed.createComponent(Preview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    toastErrorSpy.mockRestore();
    toastSuccessSpy.mockRestore();
  });

  it('creates the preview component and initializes themes', () => {
    expect(component).toBeTruthy();
    expect(previewDataClientMock.loadThemes).toHaveBeenCalled();
    expect(component.brandName()).toBe('Aurora Boutique');
    expect(component.previewUrl()).toContain('aurora-boutique');
  });

  describe('Theme Selection & Mode Switches', () => {
    it('sets first theme automatically and allows manual selection', () => {
      expect(component.activeTheme().id).toBe('theme-1');

      const secondTheme: ThemeSuggestion = {
        ...MOCK_THEME,
        id: 'theme-2',
        name: 'Dark Luxe',
      };
      component.selectTheme(secondTheme);
      expect(component.selectedTheme()?.id).toBe('theme-2');
      expect(component.activeTheme().id).toBe('theme-2');
    });

    it('toggles theme mode between light and dark and updates previewCssVars', () => {
      component.onThemeModeChange('dark');
      expect(component.themeMode()).toBe('dark');
      expect(component.previewCssVars()['--background']).toBe('#121212');

      component.onThemeModeChange('light');
      expect(component.themeMode()).toBe('light');
      expect(component.previewCssVars()['--background']).toBe('#ffffff');

      component.onThemeModeChange(null);
      expect(component.themeMode()).toBe('light');
    });

    it('handles retryThemes invocation', () => {
      component.retryThemes();
      expect(previewDataClientMock.reload).toHaveBeenCalled();
    });
  });

  describe('Viewports & Responsive Scales', () => {
    it('updates selected viewport and computes column grid and nav tabs visibility', () => {
      component.onViewportChange('mobile');
      expect(component.selectedViewport()).toBe('mobile');
      expect(component.showNavTabs()).toBe(false);
      expect(component.previewCardCols()).toBe('repeat(1, minmax(0, 1fr))');

      component.onViewportChange('tablet');
      expect(component.selectedViewport()).toBe('tablet');
      expect(component.showNavTabs()).toBe(true);
      expect(component.previewCardCols()).toBe('repeat(2, minmax(0, 1fr))');

      component.onViewportChange('desktop');
      expect(component.selectedViewport()).toBe('desktop');
      expect(component.showNavTabs()).toBe(true);
      expect(component.previewCardCols()).toBe('repeat(3, minmax(0, 1fr))');

      component.onViewportChange(undefined);
      expect(component.selectedViewport()).toBe('desktop');
    });

    it('computes preview frame styles and scales', () => {
      expect(component.previewScale()).toBeGreaterThan(0);
      const styles = component.previewFrameStyles();
      expect(styles['width']).toBeDefined();
      expect(styles['zoom']).toBeDefined();
    });

    it('computes build summary metrics', () => {
      const summary = component.buildSummary();
      expect(summary.length).toBe(5);
      const themeItem = summary.find((s) => s.id === 'theme');
      expect(themeItem).toBeDefined();
      const productsItem = summary.find((s) => s.id === 'products');
      expect(productsItem?.value).toBe('1');
    });
  });

  describe('Focus Mode & Fullscreen', () => {
    it('toggles focus mode on and off', async () => {
      expect(component.focusMode()).toBe(false);
      await component.toggleFocusMode();
      expect(component.focusMode()).toBe(true);

      await component.toggleFocusMode();
      expect(component.focusMode()).toBe(false);
    });

    it('resets focusMode when onFullscreenChange triggers without fullscreenElement', () => {
      component.focusMode.set(true);
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
      component.onFullscreenChange();
      expect(component.focusMode()).toBe(false);
    });
  });

  describe('Publish & Deployment Flow', () => {
    it('prevents deployment if no theme is selected', () => {
      component.selectedTheme.set(null);
      previewDataClientMock.themeSuggestions.set([]);
      component.confirmDeployment();
      expect(toastErrorSpy).toHaveBeenCalledWith('trans_preview_theme_not_ready');
    });

    it('prevents deployment if themes are unavailable', () => {
      component.selectTheme(MOCK_THEME);
      previewDataClientMock.themesUnavailable.set(true);
      component.confirmDeployment();
      expect(toastErrorSpy).toHaveBeenCalledWith('trans_preview_themes_unavailable');
    });

    it('successfully publishes site and triggers navigation transition', async () => {
      component.selectTheme(MOCK_THEME);
      component.confirmDeployment();

      expect(builderState.isTransitioning()).toBe(true);
      await new Promise((r) => setTimeout(r, 950));

      expect(publishApiMock.publishSite).toHaveBeenCalledWith({ themeId: 'theme-1' });
      expect(builderState.hasLiveStore()).toBe(true);
      expect(builderState.domain()).toBe('aurora-store');
      expect(toastSuccessSpy).toHaveBeenCalledWith('trans_toast_deploy_success');
      expect(authServiceMock.currentUser()?.storeSlug).toBe('aurora-store');
    });

    it('handles 409 conflict during deployment', async () => {
      publishApiMock.publishSite.mockReturnValue(throwError(() => ({ status: 409 })));
      component.selectTheme(MOCK_THEME);
      component.confirmDeployment();

      await new Promise((r) => setTimeout(r, 950));
      expect(toastErrorSpy).toHaveBeenCalledWith('trans_preview_deploy_conflict');
      expect(component.isDeploying()).toBe(false);
    });

    it('handles generic error during deployment', async () => {
      publishApiMock.publishSite.mockReturnValue(
        throwError(() => ({ status: 500, error: { message: 'Server down' } })),
      );
      component.selectTheme(MOCK_THEME);
      component.confirmDeployment();

      await new Promise((r) => setTimeout(r, 950));
      expect(toastErrorSpy).toHaveBeenCalledWith('Server down', undefined);
      expect(component.isDeploying()).toBe(false);
    });

    it('cancels deployment and closes dialog', () => {
      component.deployDialogState.set('open');
      component.cancelDeployment();
      expect(component.deployDialogState()).toBe('closed');
    });

    it('toggles focus mode entering and exiting fullscreen', async () => {
      expect(component.focusMode()).toBe(false);

      // Enter focus mode
      await component.toggleFocusMode();
      expect(component.focusMode()).toBe(true);

      // Exit focus mode
      await component.toggleFocusMode();
      expect(component.focusMode()).toBe(false);
    });

    it('resets focusMode on onFullscreenChange when fullscreenElement is null', () => {
      component.focusMode.set(true);
      component.onFullscreenChange();
      expect(component.focusMode()).toBe(false);
    });

    it('returns early from confirmDeployment when already deploying', () => {
      component.isDeploying.set(true);
      component.confirmDeployment();
      expect(publishApiMock.publishSite).not.toHaveBeenCalled();
    });
  });
});
