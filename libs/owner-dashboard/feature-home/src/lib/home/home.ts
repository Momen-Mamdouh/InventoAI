import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@invento/shared-util-i18n';
import type { ThemeApiResponse, Palette } from '@invento/shared-util-theme';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmH1, HlmH3, HlmMuted } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideImage,
  lucideUpload,
  lucideCheck,
  lucideGlobe,
  lucideMonitor,
  lucideSmartphone,
  lucideExternalLink,
  lucideShoppingCart,
  lucideAlertTriangle,
  lucideSun,
  lucideMoon,
  lucideTablet,
  lucideExpand,
  lucideMinimize,
  lucideUndo2,
  lucideRedo2,
  lucideCrosshair,
} from '@ng-icons/lucide';
import {
  StoreService,
  StoreResponse,
} from '@invento/owner-dashboard-data-access-store';
import { AuthService } from '@invento/shared-data-access-auth';
import { HlmButton } from '@spartan/helm/button';
import { HlmSeparator } from '@spartan/helm/separator';
import { HlmAlert, HlmAlertDescription } from '@spartan/helm/alert';
import { SITE_BUILDER_URL } from '@invento/owner-dashboard-util-site-builder-url';
import {
  StorefrontHome,
  StorefrontHomeHero,
} from '@invento/shared-ui-storefront-home';
import { useHeroEditor } from './use-hero-editor';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

// Base render width — wide enough for all md: breakpoints to fire
const BASE_RENDER_WIDTH = 1200;

const VIEW_MODE_CONFIG: Record<ViewMode, { maxWidth: string; scale?: number }> = {
  desktop: { maxWidth: '100%' },
  tablet: { maxWidth: '768px', scale: 768 / BASE_RENDER_WIDTH },
  mobile: { maxWidth: '375px', scale: 375 / BASE_RENDER_WIDTH },
};

const HERO_DEFAULTS = {
  imageUrl: '',
  title: 'Elevate Your Daily Tech Setup',
  subtitle:
    'Discover premium accessories designed for minimalist productivity & peak performance.',
  ctaLabel: 'Shop Now',
  ctaHref: '',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    TranslatePipe,
    HlmSkeleton,
    HlmSpinner,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmH1,
    HlmH3,
    HlmMuted,
    HlmSeparator,
    HlmAlert,
    HlmAlertDescription,
    StorefrontHome,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [
    provideIcons({
      lucideImage,
      lucideUpload,
      lucideCheck,
      lucideGlobe,
      lucideMonitor,
      lucideSmartphone,
      lucideExternalLink,
      lucideShoppingCart,
      lucideAlertTriangle,
      lucideSun,
      lucideMoon,
      lucideTablet,
      lucideExpand,
      lucideMinimize,
      lucideUndo2,
      lucideRedo2,
      lucideCrosshair,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly authService = inject(AuthService);

  readonly siteBuilderUrl = signal<string>(inject(SITE_BUILDER_URL));

  // View mode & UI States
  viewMode = signal<ViewMode>('desktop');
  previewThemeMode = signal<'light' | 'dark'>('light');
  isSaved = signal<boolean>(true);
  isFullScreenPreview = signal<boolean>(false);

  // Hero Editor Composable
  readonly hero = useHeroEditor(HERO_DEFAULTS);

  // Focal Point State
  focalPoint = signal<{ x: number; y: number }>({ x: 50, y: 50 });
  isDraggingFocal = signal<boolean>(false);

  // Store Hydration State Signals
  isLoadingStore = signal<boolean>(true);
  storeLoadError = signal<string | null>(null);
  storeData = signal<StoreResponse | null>(null);

  storeUrl = computed(() => {
    const slug = this.storeData()?.slug || 'yourbrand';
    return `http://localhost:4300/${slug}`;
  });

  storeDomain = computed(() => {
    const slug = this.storeData()?.slug || 'yourbrand';
    return `http://localhost:4300/${slug}`;
  });

  storeName = computed(() => this.storeData()?.name || 'YourBrand');

  themeStyles = computed(() => {
    const theme = this.storeData()?.theme as ThemeApiResponse | undefined;
    if (!theme) return {};

    const mode = this.previewThemeMode();
    const palette: Palette =
      (mode === 'dark' ? theme.dark : theme.light) || theme.light || theme.dark;

    const styles: Record<string, string> = {};
    for (const [key, value] of Object.entries(palette)) {
      if (!value) continue;
      const cssKey = key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase();
      styles[`--${cssKey}`] = value;
      styles[`--color-${cssKey}`] = value;
    }

    if (palette.card) styles['--sidebar'] = palette.card;
    if (palette.foreground) styles['--sidebar-foreground'] = palette.foreground;
    if (palette.primary) styles['--sidebar-primary'] = palette.primary;
    if (palette.primaryForeground)
      styles['--sidebar-primary-foreground'] = palette.primaryForeground;
    if (palette.accent) styles['--sidebar-accent'] = palette.accent;
    if (palette.accentForeground) styles['--sidebar-accent-foreground'] = palette.accentForeground;
    if (palette.border) styles['--sidebar-border'] = palette.border;
    if (palette.card) styles['--input-background'] = palette.card;
    if (palette.muted) styles['--switch-background'] = palette.muted;

    if (theme.radius) {
      styles['--radius'] = theme.radius;
    }

    return styles;
  });

  themeClass = computed(() => (this.previewThemeMode() === 'dark' ? 'dark' : ''));
  viewModeMaxWidth = computed(() => VIEW_MODE_CONFIG[this.viewMode()].maxWidth);
  previewScale = computed(() => VIEW_MODE_CONFIG[this.viewMode()].scale);
  previewTransform = computed(() => {
    const scale = this.previewScale();
    return scale ? `scale(${scale})` : 'none';
  });
  // The inner render width for scaled modes
  previewInnerWidth = computed(() => {
    const scale = this.previewScale();
    return scale ? `${BASE_RENDER_WIDTH}px` : undefined;
  });

  // Focal point object-position CSS value
  objectPosition = computed(() => `${this.focalPoint().x}% ${this.focalPoint().y}%`);

  readonly previewHero = computed<StorefrontHomeHero>(() => ({
    imageUrl: this.hero.imageUrl(),
    headline: this.hero.title(),
    subtitle: this.hero.subtitle(),
    ctaLabel: this.hero.ctaLabel(),
    ctaHref: this.hero.ctaHref(),
    objectPosition: this.objectPosition(),
  }));

  // Keyboard shortcuts
  @HostListener('document:keydown.control.s')
  @HostListener('document:keydown.meta.s')
  onKeyDownSave(): void {
    const event = window.event as KeyboardEvent;
    event?.preventDefault();
    if (!this.hero.isDirty() || this.hero.isSaving()) return;
    this.saveChanges();
  }

  @HostListener('document:keydown.escape')
  onKeyDownEscape(): void {
    if (this.isDraggingFocal()) {
      this.isDraggingFocal.set(false);
      return;
    }
    if (this.hero.isDirty() && !this.hero.isSaving()) {
      this.discard();
    }
  }

  @HostListener('document:keydown.control.z')
  @HostListener('document:keydown.meta.z')
  onKeyDownUndo(): void {
    const event = window.event as KeyboardEvent;
    if (event?.shiftKey) return;
    event?.preventDefault();
    if (this.hero.canUndo()) {
      this.hero.undo();
    }
  }

  @HostListener('document:keydown.control.shift.z')
  @HostListener('document:keydown.meta.shift.z')
  @HostListener('document:keydown.control.y')
  @HostListener('document:keydown.meta.y')
  onKeyDownRedo(): void {
    const event = window.event as KeyboardEvent;
    event?.preventDefault();
    if (this.hero.canRedo()) {
      this.hero.redo();
    }
  }

  // Theme toggle
  togglePreviewTheme(): void {
    this.previewThemeMode.set(
      this.previewThemeMode() === 'dark' ? 'light' : 'dark',
    );
  }

  // Full-screen preview toggle
  toggleFullScreenPreview(): void {
    this.isFullScreenPreview.set(!this.isFullScreenPreview());
  }

  // Focal point handlers
  onFocalPointMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDraggingFocal.set(true);
    this.updateFocalPoint(event);
  }

  onFocalPointTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isDraggingFocal.set(true);
    this.updateFocalPointTouch(event);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.isDraggingFocal()) return;
    this.updateFocalPoint(event);
  }

  onDocumentTouchMove(event: TouchEvent): void {
    if (!this.isDraggingFocal()) return;
    this.updateFocalPointTouch(event);
  }

  onDocumentMouseUp(): void {
    if (this.isDraggingFocal()) {
      this.isDraggingFocal.set(false);
      this.hero.setField('imageUrl', this.hero.imageUrl());
    }
  }

  private updateFocalPoint(event: MouseEvent): void {
    const img = (event.target as HTMLElement).closest('[data-focal-container]') as HTMLElement;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    this.focalPoint.set({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
    this.isSaved.set(false);
  }

  private updateFocalPointTouch(event: TouchEvent): void {
    const touch = event.touches[0];
    const img = (touch.target as HTMLElement).closest('[data-focal-container]') as HTMLElement;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = Math.round(((touch.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((touch.clientY - rect.top) / rect.height) * 100);
    this.focalPoint.set({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
    this.isSaved.set(false);
  }

  resetFocalPoint(): void {
    this.focalPoint.set({ x: 50, y: 50 });
    this.isSaved.set(false);
  }

  // Hero image file select
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.focalPoint.set({ x: 50, y: 50 });
      this.hero.onFileSelected(file, () => {
        this.hero.pushHistory();
      });
      this.isSaved.set(false);
    }
  }

  // Discard changes
  discard(): void {
    this.hero.discard(this.heroSnapshot);
    this.focalPoint.set({ x: 50, y: 50 });
    this.isSaved.set(true);
  }

  // Open live site
  openLive(): void {
    window.open(this.storeUrl(), '_blank');
  }

  // Save changes (optimistic UI)
  saveChanges(): void {
    this.hero.save(this.storeService);
    this.isSaved.set(!this.hero.isDirty());
  }

  // Undo / Redo
  undo(): void {
    this.hero.undo();
  }

  redo(): void {
    this.hero.redo();
  }

  // Private helper for snapshot
  private get heroSnapshot() {
    return {
      imageUrl: this.hero.imageUrl(),
      title: this.hero.title(),
      subtitle: this.hero.subtitle(),
      ctaLabel: this.hero.ctaLabel(),
      ctaHref: this.hero.ctaHref(),
    };
  }

  // Lifecycle
  ngOnInit(): void {
    this.hero.pushHistory();

    const slug = this.authService.getStoreSlug();

    if (!slug) {
      this.isLoadingStore.set(false);
      this.storeData.set(null);
      return;
    }

    this.isLoadingStore.set(true);
    this.storeLoadError.set(null);

    this.storeService.getStore(slug).subscribe({
      next: (data: StoreResponse) => {
        this.storeData.set(data);
        this.isLoadingStore.set(false);

        const isClean = this.isSaved();

        if (data.hero) {
          this.hero.imageUrl.set(data.hero.imageUrl || '');
          this.hero.title.set(data.hero.headline || (data.name ? `Welcome to ${data.name}` : this.hero.title()));
          this.hero.subtitle.set(data.hero.subtitle || data.description || this.hero.subtitle());
          this.hero.ctaLabel.set(data.hero.ctaLabel || this.hero.ctaLabel());
          this.hero.ctaHref.set(data.hero.ctaHref || '');
          this.focalPoint.set({ x: 50, y: 50 });

          this.hero.pushHistory();

          if (isClean) {
            this.isSaved.set(true);
          }
        }
      },
      error: (err) => {
        this.isLoadingStore.set(false);
        const errMsg =
          err.status === 404
            ? `Store "${slug}" was not found.`
            : err.error?.message || err.message || 'Failed to load store data.';
        this.storeLoadError.set(errMsg);
        console.warn(
          `Hydration: GET /site/${slug} failed. Keeping default placeholder state.`,
          err,
        );
      },
    });
  }
}
