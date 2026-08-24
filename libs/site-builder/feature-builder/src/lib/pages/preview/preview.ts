import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  ElementRef,
  viewChild,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser, NgStyle } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideMaximize2,
  lucideMinimize2,
  lucideMoon,
  lucideSmartphoneCharging,
  lucideSun,
  lucideTablet,
  lucideTvMinimal,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import {
  PreviewSize,
  PreviewViewport,
  Viewport,
} from '@invento/core';
import { ThemeSuggestion } from '@invento/shared-util-preview-types';
import { ApiConfig } from '@invento/site-builder-data-access-preview';
import { PageHeader } from '@invento/shared-ui-page-header';
import { HlmDialogImports } from '@spartan/helm/dialog';
import {
  BuilderState,
  PublishApi,
  PreviewDataClient,
} from '@invento/site-builder-data-access-builder';
import { ContainerWidth } from '@invento/shared-ui-container-width';
import { hlmH2, hlmH3, hlmH4, hlmP } from '@spartan/helm/typography';
import { DoubleSlash } from '@invento/shared-ui-double-slash';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';
import { toastApiError } from '../../utils/toast-api-error';
import {
  PALETTE_DEFAULTS,
  DEFAULT_RADIUS,
  deriveDarkPalette,
} from '@invento/core';
import { AuthService } from '@invento/shared-data-access-auth';

/**
 * Neutral stand-in rendered while themes are still in flight.
 *
 * The preview frame reads a dozen theme fields directly, so it needs a
 * non-null theme at all times. Using this instead of MOCK_THEMES[0] keeps a
 * mock brand from flashing on screen before the backend has answered.
 */
const PLACEHOLDER_THEME: ThemeSuggestion = {
  id: '',
  name: 'preview_theme_pending',
  description: '',
  colors: PALETTE_DEFAULTS,
  radius: DEFAULT_RADIUS,
};

@Component({
  selector: 'app-preview',
  imports: [
    PageHeader,
    HlmButtonImports,
    HlmDialogImports,
    NgIcon,
    NgStyle,
    ContainerWidth,
    DoubleSlash,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideTvMinimal,
      lucideTablet,
      lucideSmartphoneCharging,
      lucideMaximize2,
      lucideMinimize2,
      lucideChevronLeft,
      lucideChevronRight,
      lucideSun,
      lucideMoon,
    }),
  ],
  templateUrl: './preview.html',
  styleUrl: './preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preview {
  protected readonly hlmH2 = hlmH2;
  protected readonly hlmH3 = hlmH3;
  protected readonly hlmH4 = hlmH4;
  protected readonly hlmP = hlmP;

  private readonly builderState = inject(BuilderState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _localeService = inject(LocaleService);
  private readonly previewDataClientService = inject(PreviewDataClient);
  private readonly publishApi = inject(PublishApi);
  private readonly authService = inject(AuthService);
  private readonly apiConfig = inject(ApiConfig);

  readonly themeSuggestions = this.previewDataClientService.themeSuggestions;
  readonly products = this.previewDataClientService.products;
  readonly navTabs = this.previewDataClientService.navTabs;
  readonly isLoading = this.previewDataClientService.isLoading;
  readonly themeError = this.previewDataClientService.themeError;
  readonly themesUnavailable = this.previewDataClientService.themesUnavailable;
  readonly logoUrl = this.builderState.logoUrl;

  readonly previewUrl = computed(() => {
    const userDomain = this.builderState.domain() || 'my-site';
    const cleanDomain = userDomain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '');
    return `https://localhost/${cleanDomain || 'my-site'}.com`;
  });

  readonly skeletonThemes = Array(4);
  readonly skeletonProducts = Array(3);
  /** Null until themes have arrived and one has been chosen. */
  readonly selectedTheme = signal<ThemeSuggestion | null>(null);

  /** Never null — what the template and preview frame render against. */
  readonly activeTheme = computed<ThemeSuggestion>(() => this.selectedTheme() ?? PLACEHOLDER_THEME);
  readonly selectedViewport = signal<PreviewViewport>('desktop');
  readonly selectedSize = signal<PreviewSize>('M');
  readonly themeMode = signal<'light' | 'dark'>('light');
  readonly deployDialogState = signal<'closed' | 'open'>('closed');
  readonly focusMode = signal(false);
  readonly isDeploying = signal(false);

  readonly themeButtons = viewChildren<ElementRef<HTMLButtonElement>>('themeButton');
  readonly focusContainerRef = viewChild<ElementRef<HTMLElement>>('focusContainer');
  protected readonly _containerWidth = signal<number>(0);

  readonly sizes: readonly PreviewSize[] = ['S', 'M', 'L', 'XL'] as const;
  private readonly sizeFactors: Record<PreviewSize, number> = { S: 0.8, M: 1.0, L: 1.2, XL: 1.5 };

  readonly viewports: readonly Viewport[] = [
    { id: 'desktop', icon: 'lucideTvMinimal', label: 'preview_desktop', width: 1200 },
    { id: 'tablet', icon: 'lucideTablet', label: 'preview_tablet', width: 768 },
    { id: 'mobile', icon: 'lucideSmartphoneCharging', label: 'preview_mobile', width: 390 },
  ] as const;

  readonly previewCssVars = computed<Record<string, string>>(() => {
    const theme = this.activeTheme();
    const isDark = this.themeMode() === 'dark';
    const light = theme?.colors ?? PALETTE_DEFAULTS;
    // A theme with no dark palette used to fall through to its light one, so
    // the toggle changed nothing. Derive a dark surface from the light brand
    // instead — every theme now has a visibly different dark mode.
    const c = isDark ? (theme?.darkColors ?? deriveDarkPalette(light)) : light;
    const r = theme?.radius ?? DEFAULT_RADIUS;

    return {
      '--background': c.background,
      '--foreground': c.foreground,
      '--primary': c.primary,
      '--primary-foreground': c.primaryForeground,
      '--secondary': c.secondary,
      '--secondary-foreground': c.secondaryForeground,
      '--accent': c.accent,
      '--destructive': c.destructive,
      '--border': c.border,
      '--ring': c.ring,
      '--radius': r,
      '--radius-sm': `calc(${r} / 2)`,
      '--radius-lg': `calc(${r} * 1.5)`,
    };
  });

  readonly simulatedPxWidth = computed<number>(() => {
    const configured = this.viewports.find((v) => v.id === this.selectedViewport())?.width;
    if (this.selectedViewport() === 'desktop') {
      return Math.max(this._containerWidth() || 0, configured ?? 1200);
    }
    return configured ?? this._containerWidth() ?? 1200;
  });

  readonly sizeScale = computed(() => this.sizeFactors[this.selectedSize()]);

  readonly previewScale = computed<number>(() => {
    const cw = this._containerWidth();
    if (cw === 0) return 1;
    return Math.min(1, cw / this.simulatedPxWidth()) * this.sizeScale();
  });

  readonly previewFrameStyles = computed<Record<string, string>>(() => ({
    width: `${this.simulatedPxWidth()}px`,
    zoom: String(this.previewScale()),
    transition: 'zoom 300ms ease-in-out, width 300ms ease-in-out',
  }));

  readonly previewCardCols = computed<string>(() => {
    switch (this.selectedViewport()) {
      case 'mobile':
        return 'repeat(1, minmax(0, 1fr))';
      case 'tablet':
        return 'repeat(2, minmax(0, 1fr))';
      default:
        return 'repeat(3, minmax(0, 1fr))';
    }
  });

  readonly showNavTabs = computed<boolean>(() => this.selectedViewport() !== 'mobile');

  readonly heroTextPadding = computed<Record<string, string>>(() =>
    this.selectedViewport() === 'mobile' ? { padding: '1rem' } : { padding: '1.5rem' },
  );

  readonly brandName = computed(
    () => this.builderState.businessName() || this.builderState.brainstorm() || 'InventoAI',
  );

  readonly featuredProduct = computed(() => this.products()[0] || null);

  readonly deployChevron = computed(() =>
    this._localeService.isRtl() ? 'lucideChevronLeft' : 'lucideChevronRight',
  );

  readonly buildSummary = computed(() => [
    { label: 'preview_theme', value: this._localeService.translate(this.activeTheme().name) },
    {
      label: 'preview_products',
      value: this._localeService.translate('build_items', { n: this.products().length }),
    },
    {
      label: 'preview_variants',
      value: this._localeService.translate('build_skus', { n: this.products().length * 4 }),
    },
    {
      label: 'preview_pages',
      value: this._localeService.translate('build_routes', { n: this.navTabs().length + 4 }),
    },
    { label: 'preview_status', value: this.selectedViewport().toUpperCase() },
  ]);

  private readonly _userHasManuallySelectedTheme = signal(false);

  constructor() {
    this.previewDataClientService.loadThemes();

    // Hold the navigation loader up until there is something real to show.
    // Clearing it on `!isLoading()` alone fired immediately whenever Validation
    // had already fetched the themes (loadThemes() returns early and never
    // flips isLoading), so the loader vanished the instant Preview mounted and
    // the skeleton showed through instead.
    effect(() => {
      // `loaded` covers the empty and failed outcomes too — gating on themes
      // alone would leave the navigation loader spinning forever whenever the
      // store has none.
      if (this.previewDataClientService.loaded()) {
        this.builderState.isNavigating.set(false);
      }
    });

    // Keep the default selection in step with whatever themes arrive, but never
    // override a theme the user picked themselves.
    effect(() => {
      const firstTheme = this.themeSuggestions()[0];
      if (firstTheme && !this._userHasManuallySelectedTheme()) {
        this.selectedTheme.set(firstTheme);
      }
    });
  }

  retryThemes(): void {
    this.previewDataClientService.reload();
  }

  selectTheme(theme: ThemeSuggestion): void {
    this._userHasManuallySelectedTheme.set(true);
    this.selectedTheme.set(theme);
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement) {
      this.focusMode.set(false);
    }
  }

  async toggleFocusMode(): Promise<void> {
    if (this.focusMode()) {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          /* ignore */
        }
      }
      this.focusMode.set(false);
      return;
    }

    this.focusMode.set(true);
    const el = this.focusContainerRef()?.nativeElement;
    if (el && isPlatformBrowser(this.platformId)) {
      try {
        await el.requestFullscreen();
      } catch {
        /* ignore (user gesture may be missing) */
      }
    }
  }

  confirmDeployment(): void {
    if (this.isDeploying()) return;

    // Never publish the placeholder: its id is empty, which the backend would
    // reject anyway, and it is not a theme the user ever chose.
    const theme = this.selectedTheme();
    if (!theme) {
      toast.error(this._localeService.translate('preview_theme_not_ready'));
      return;
    }

    if (this.themesUnavailable()) {
      toast.error(this._localeService.translate('preview_themes_unavailable'));
      return;
    }

    this.isDeploying.set(true);

    const toastId = toast.loading(this._localeService.translate('toast_deploying_site'));

    this.publishApi.publishSite({ themeId: theme.id }).subscribe({
      next: () => {
        this.isDeploying.set(false);
        this.closeDeployDialog();
        this.builderState.selectedTheme.set(theme.id);

        toast.success(this._localeService.translate('toast_deploy_success'), { id: toastId });

        const redirectUrl = `${this.apiConfig.inventoLoginUrl}?forceLogout=true`;
        this.authService.logout();

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      },
      error: (err: { status?: number }) => {
        this.isDeploying.set(false);

        // A 409 here is never about the theme — a bad themeId is a 404. It means
        // the backend draft has not reached the step publish requires, almost
        // always because theme generation never completed for this draft. The
        // recovery is to redo the Validation step, which is not something the
        // raw message says, so it is spelled out.
        if (err?.status === 409) {
          toast.error(this._localeService.translate('preview_deploy_conflict'), { id: toastId });
          return;
        }

        toastApiError(err, 'toast_deploy_failed', this._localeService, toastId);
      },
    });
  }

  cancelDeployment(): void {
    this.closeDeployDialog();
    queueMicrotask(() => {
      const index = this.themeSuggestions().findIndex((t) => t.id === this.activeTheme().id);
      this.themeButtons()[index]?.nativeElement.focus();
    });
  }

  /**
   * The dialog's open/closed state is owned solely by this signal.
   *
   * Calling the portal's own ctx.close() alongside the [state] binding made the
   * dialog close, then reopen when change detection re-applied state="open",
   * then close again once (closed) fired — a visible flicker.
   */
  closeDeployDialog(): void {
    this.deployDialogState.set('closed');
  }
}
