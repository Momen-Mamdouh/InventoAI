import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@invento/shared-util-i18n';
import type { ThemeApiResponse, Palette } from '@invento/shared-util-theme';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmSeparator } from '@spartan/helm/separator';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmH1, HlmH3, HlmH4, HlmMuted } from '@spartan/helm/typography';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideImage,
  lucideUpload,
  lucideLayoutGrid,
  lucideFolderTree,
  lucideChevronDown,
  lucideChevronUp,
  lucideChevronRight,
  lucideCheckCircle2,
  lucidePackage,
  lucideCheck,
  lucideGlobe,
  lucideMonitor,
  lucideSmartphone,
  lucideExternalLink,
  lucideShoppingCart,
  lucideTrash2,
  lucidePlus,
  lucideRefreshCw,
  lucideAlertTriangle,
  lucideStore,
  lucideSun,
  lucideMoon,
} from '@ng-icons/lucide';
import {
  StoreService,
  HeroSectionResponse,
  StoreResponse,
} from '@invento/owner-dashboard-data-access-store';
import { CategoriesService } from '@invento/owner-dashboard-data-access-category';
import { ProductService } from '@invento/owner-dashboard-data-access-product';
import { AuthService } from '@invento/shared-data-access-auth';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmToggleGroupImports } from '@spartan/helm/toggle-group';
import { SITE_BUILDER_URL } from '@invento/owner-dashboard-util-site-builder-url';

interface Category {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string | null;
  slug?: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  img: string;
  selected: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    TranslatePipe,
    HlmSkeleton,
    HlmSpinner,
    EmptyState,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTextareaImports,
    HlmH1,
    HlmH3,
    HlmH4,
    HlmMuted,
    HlmToggleGroupImports,
    HlmSeparator,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [
    provideIcons({
      lucideImage,
      lucideUpload,
      lucideLayoutGrid,
      lucideFolderTree,
      lucideChevronDown,
      lucideChevronUp,
      lucideChevronRight,
      lucideCheckCircle2,
      lucidePackage,
      lucideCheck,
      lucideGlobe,
      lucideMonitor,
      lucideSmartphone,
      lucideExternalLink,
      lucideShoppingCart,
      lucideTrash2,
      lucidePlus,
      lucideRefreshCw,
      lucideAlertTriangle,
      lucideStore,
      lucideSun,
      lucideMoon,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly siteBuilderUrl = signal<string>(inject(SITE_BUILDER_URL));

  // View mode & UI States -> categoryPickerOpen is now false by default
  viewMode = signal<'desktop' | 'mobile'>('desktop');
  previewThemeMode = signal<'light' | 'dark'>('light');
  categoryPickerOpen = signal<boolean>(false);
  productPickerOpen = signal<boolean>(false);
  isSaved = signal<boolean>(true);

  // Store Hydration State Signals
  isLoadingStore = signal<boolean>(true);
  isLoadingCategories = signal<boolean>(true);
  isLoadingProducts = signal<boolean>(true);
  storeLoadError = signal<string | null>(null);
  storeData = signal<StoreResponse | null>(null);
  storeUrl = computed(() => {
    const slug = this.storeData()?.slug || 'yourbrand';
    return `http://localhost:4300/${slug}`;
  });
  storeDomain = computed(() => {
    const slug = this.storeData()?.slug || 'yourbrand';
    return `http://localhost:4300/${slug}.com`;
  });
  storeName = computed(() => {
    return this.storeData()?.name || 'YourBrand';
  });

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

  themeClass = computed(() => {
    return this.previewThemeMode() === 'dark' ? 'dark' : '';
  });

  togglePreviewTheme(): void {
    this.previewThemeMode.set(this.previewThemeMode() === 'dark' ? 'light' : 'dark');
  }

  // Hero Section State
  heroImageUrl = signal<string>('');
  heroTitle = signal<string>('Elevate Your Daily Tech Setup');
  heroSubtitle = signal<string>(
    'Discover premium accessories designed for minimalist productivity & peak performance.',
  );
  heroCtaLabel = signal<string>('Shop Now');
  heroCtaHref = signal<string>('');
  heroImageFile = signal<File | null>(null);

  // Hero Save & Loading State
  isSavingHero = signal<boolean>(false);
  heroSaveError = signal<string | null>(null);

  // Last Saved Snapshot for Discard
  private heroSnapshot = signal<{
    imageUrl: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  }>({
    imageUrl: '',
    title: 'Elevate Your Daily Tech Setup',
    subtitle:
      'Discover premium accessories designed for minimalist productivity & peak performance.',
    ctaLabel: 'Shop Now',
    ctaHref: '',
  });

  // Categories Section State
  categoriesTitle = signal<string>('Categories');
  categories = signal<Category[]>([]);

  // Products Section State
  featuredTitle = signal<string>('Featured Products');
  products = signal<Product[]>([]);

  // Computed Properties
  selectedProducts = computed(() => this.products().filter((product) => product.selected));

  ngOnInit(): void {
    // Initialize snapshot with default values
    this.updateHeroSnapshot({
      imageUrl: this.heroImageUrl(),
      title: this.heroTitle(),
      subtitle: this.heroSubtitle(),
      ctaLabel: this.heroCtaLabel(),
      ctaHref: this.heroCtaHref(),
    });

    // 1. Fetch featured categories (isFeatured=true, limit=3, isPublished=true)
    this.isLoadingCategories.set(true);
    this.categoriesService.list({ isFeatured: true, limit: 3, isPublished: true }).subscribe({
      next: (res) => {
        this.isLoadingCategories.set(false);
        if (res.items && res.items.length > 0) {
          const mapped: Category[] = res.items.map((cat, idx) => ({
            id: cat.id || cat.slug || `cat-${idx}`,
            name: cat.name,
            icon: '📦',
            imageUrl: cat.imageUrl || null,
            slug: cat.slug,
          }));
          this.categories.set(mapped);
        }
      },
      error: (err) => {
        this.isLoadingCategories.set(false);
        console.warn('Failed to fetch featured categories:', err);
      },
    });

    // 2. Fetch featured products (isFeatured=true, limit=3, status=active)
    this.isLoadingProducts.set(true);
    this.productService.getProducts({ isFeatured: 'true', limit: 3, status: 'active' }).subscribe({
      next: (res) => {
        this.isLoadingProducts.set(false);
        if (res.items && res.items.length > 0) {
          const currencySymbol =
            this.storeData()?.currency === 'USD' || !this.storeData()?.currency
              ? '$'
              : `${this.storeData()?.currency} `;
          const mapped: Product[] = res.items.map((p, idx) => {
            const price =
              p.minPriceAmount != null ? `${currencySymbol}${p.minPriceAmount / 100}` : '$0';
            return {
              id: p.id || p.slug || `p-${idx}`,
              name: p.title,
              price: price,
              img: p.imageUrl || '',
              selected: true,
            };
          });
          this.products.set(mapped);
        }
      },
      error: (err) => {
        this.isLoadingProducts.set(false);
        console.warn('Failed to fetch featured products:', err);
      },
    });

    // Resolve store slug strictly from auth token / current user
    const slug = this.authService.getStoreSlug();

    if (!slug) {
      this.isLoadingStore.set(false);
      this.storeData.set(null);
      return;
    }

    this.isLoadingStore.set(true);
    this.storeLoadError.set(null);

    // Hydrate store data from public GET /site/{slug} endpoint
    this.storeService.getStore(slug).subscribe({
      next: (data: StoreResponse) => {
        this.storeData.set(data);
        this.isLoadingStore.set(false);

        // Guard against clobbering in-progress edits
        const isClean = this.isSaved();

        if (data.hero) {
          const heroData = {
            imageUrl: data.hero.imageUrl || '',
            headline:
              data.hero.headline || (data.name ? `Welcome to ${data.name}` : this.heroTitle()),
            subtitle: data.hero.subtitle || data.description || this.heroSubtitle(),
            ctaLabel: data.hero.ctaLabel || this.heroCtaLabel(),
            ctaHref: data.hero.ctaHref || '',
          };

          // Update hero snapshot so Discard reverts to real saved state
          this.updateHeroSnapshot({
            imageUrl: heroData.imageUrl,
            title: heroData.headline,
            subtitle: heroData.subtitle,
            ctaLabel: heroData.ctaLabel,
            ctaHref: heroData.ctaHref,
          });

          // Only update live signals if user hasn't made unpersisted edits
          if (isClean) {
            this.heroImageUrl.set(heroData.imageUrl);
            this.heroTitle.set(heroData.headline);
            this.heroSubtitle.set(heroData.subtitle);
            this.heroCtaLabel.set(heroData.ctaLabel);
            this.heroCtaHref.set(heroData.ctaHref);
          }
        }

        if (isClean) {
          this.isSaved.set(true);
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

  private applyHeroResponse(res: HeroSectionResponse): void {
    if (res.imageUrl) this.heroImageUrl.set(res.imageUrl);
    if (res.headline) this.heroTitle.set(res.headline);
    if (res.subtitle) this.heroSubtitle.set(res.subtitle);
    if (res.ctaLabel) this.heroCtaLabel.set(res.ctaLabel);
    this.heroCtaHref.set(res.ctaHref || '');

    this.updateHeroSnapshot({
      imageUrl: this.heroImageUrl(),
      title: this.heroTitle(),
      subtitle: this.heroSubtitle(),
      ctaLabel: this.heroCtaLabel(),
      ctaHref: this.heroCtaHref(),
    });
  }

  private updateHeroSnapshot(data: {
    imageUrl: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  }): void {
    this.heroSnapshot.set({ ...data });
  }

  // View Mode Handler
  setViewMode(mode: 'desktop' | 'mobile') {
    this.viewMode.set(mode);
  }

  /**
   * `hlm-toggle-group` (type="single", non-nullable) always emits a single, defined value —
   * this guard just narrows the brain's broader `T | readonly T[] | null | undefined` output.
   * `Array.isArray` does not narrow a `readonly T[]` out of the union, so `typeof` is used
   * instead (both branch values are string literals).
   */
  onViewModeChange(mode: 'desktop' | 'mobile' | readonly ('desktop' | 'mobile')[] | null | undefined): void {
    if (typeof mode === 'string') {
      this.setViewMode(mode);
    }
  }

  // Hero Section Handlers
  onHeroTitleChange(title: string) {
    this.heroTitle.set(title);
    this.isSaved.set(false);
  }

  onHeroSubtitleChange(subtitle: string) {
    this.heroSubtitle.set(subtitle);
    this.isSaved.set(false);
  }

  onHeroCtaLabelChange(label: string) {
    this.heroCtaLabel.set(label);
    this.isSaved.set(false);
  }

  onHeroCtaHrefChange(href: string) {
    this.heroCtaHref.set(href);
    this.isSaved.set(false);
  }

  openHeroCta() {
    const href = this.heroCtaHref().trim();
    if (href) {
      window.open(href, '_blank');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.heroImageFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.heroImageUrl.set(reader.result as string);
        this.isSaved.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  // Categories Handlers
  onCategoriesTitleChange(title: string) {
    this.categoriesTitle.set(title);
    this.isSaved.set(false);
  }

  updateCategoryIcon(id: string, icon: string) {
    this.categories.update((cats) => cats.map((c) => (c.id === id ? { ...c, icon } : c)));
    this.isSaved.set(false);
  }

  updateCategoryName(id: string, name: string) {
    this.categories.update((cats) => cats.map((c) => (c.id === id ? { ...c, name } : c)));
    this.isSaved.set(false);
  }

  addCategory() {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: 'New Category',
      icon: '✨',
    };
    this.categories.update((cats) => [...cats, newCategory]);
    this.isSaved.set(false);
  }

  removeCategory(id: string) {
    this.categories.update((cats) => cats.filter((cat) => cat.id !== id));
    this.isSaved.set(false);
  }

  // Products Handlers
  onFeaturedTitleChange(title: string) {
    this.featuredTitle.set(title);
    this.isSaved.set(false);
  }

  toggleProduct(id: string) {
    this.products.update((items) =>
      items.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
    );
    this.isSaved.set(false);
  }

  // Actions
  fallbackImg(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=400&auto=format&fit=crop';
  }

  fallbackHeroImg() {
    this.heroImageUrl.set('');
  }

  discard() {
    const snapshot = this.heroSnapshot();
    this.heroImageUrl.set(snapshot.imageUrl);
    this.heroTitle.set(snapshot.title);
    this.heroSubtitle.set(snapshot.subtitle);
    this.heroCtaLabel.set(snapshot.ctaLabel);
    this.heroCtaHref.set(snapshot.ctaHref);
    this.heroImageFile.set(null);
    this.heroSaveError.set(null);
    this.isSaved.set(true);
  }

  openLive() {
    window.open(this.storeUrl(), '_blank');
  }

  saveChanges() {
    this.isSavingHero.set(true);
    this.heroSaveError.set(null);

    const formData = new FormData();
    formData.append('headline', this.heroTitle());
    formData.append('subtitle', this.heroSubtitle());
    formData.append('ctaLabel', this.heroCtaLabel());
    formData.append('ctaHref', this.heroCtaHref());

    const file = this.heroImageFile();
    if (file) {
      formData.append('image', file);
    }

    this.storeService.updateHero(formData).subscribe({
      next: (res) => {
        this.applyHeroResponse(res);
        this.heroImageFile.set(null);
        this.isSaved.set(true);
        this.isSavingHero.set(false);
      },
      error: (err) => {
        const message =
          err.error?.message || err.message || 'Failed to update hero section. Please try again.';
        this.heroSaveError.set(message);
        this.isSavingHero.set(false);
      },
    });
  }
}
