import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@invento/core';
import { HlmSkeleton } from '@spartan/helm/skeleton';
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
} from '@ng-icons/lucide';
import {
  StoreService,
  HeroSectionResponse,
  StoreResponse,
} from '../../features/store/store.service';

interface Category {
  id: string;
  name: string;
  icon: string;
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
  imports: [CommonModule, NgIcon, TranslatePipe, HlmSkeleton],
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
    }),
  ],
})
export class HomeComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly route = inject(ActivatedRoute);

  // View mode & UI States -> categoryPickerOpen is now false by default
  viewMode = signal<'desktop' | 'mobile'>('desktop');
  categoryPickerOpen = signal<boolean>(false);
  productPickerOpen = signal<boolean>(false);
  isSaved = signal<boolean>(true);

  // Store Hydration State Signals
  isLoadingStore = signal<boolean>(true);
  storeLoadError = signal<string | null>(null);
  storeData = signal<StoreResponse | null>(null);
  storeUrl = computed(() => {
    const slug = this.storeData()?.slug || 'yourbrand';
    return `https://${slug}.inventoai.com`;
  });
  storeDomain = computed(() => {
    const slug = this.storeData()?.slug || 'yourbrand';
    return `${slug}.inventoai.com`;
  });
  storeName = computed(() => {
    return this.storeData()?.name || 'YourBrand';
  });

  themeStyles = computed(() => {
    const theme = this.storeData()?.theme as any;
    if (!theme) return {};

    // Default to dark palette to match preview image, fallback to light
    const palette = theme.dark || theme.light;
    if (!palette) return {};

    const styles: Record<string, string> = {};
    for (const [key, value] of Object.entries(palette)) {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      styles[`--${cssKey}`] = value as string;
      styles[`--color-${cssKey}`] = value as string;
    }

    if (theme.radius) {
      styles['--radius'] = theme.radius;
    }

    return styles;
  });

  themeClass = computed(() => {
    const theme = this.storeData()?.theme as any;
    // Return dark class to ensure text/bg contrast correctly applies if using dark theme
    return theme?.dark ? 'dark' : '';
  });

  // Hero Section State
  heroImageUrl = signal<string>(
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
  );
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
    imageUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
    title: 'Elevate Your Daily Tech Setup',
    subtitle:
      'Discover premium accessories designed for minimalist productivity & peak performance.',
    ctaLabel: 'Shop Now',
    ctaHref: '',
  });

  // Categories Section State
  categoriesTitle = signal<string>('Categories');
  categories = signal<Category[]>([
    { id: '1', name: 'Laptops', icon: '💻' },
    { id: '2', name: 'Audio', icon: '🎧' },
    { id: '3', name: 'Mobile', icon: '📱' },
    { id: '4', name: 'Wearables', icon: '⌚' },
    { id: '5', name: 'Cameras', icon: '📷' },
    { id: '6', name: 'Networking', icon: '🌐' },
  ]);

  // Products Section State
  featuredTitle = signal<string>('Featured Products');
  products = signal<Product[]>([
    {
      id: 'p1',
      name: 'AuraX Pro ANC',
      price: '$299',
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
      selected: true,
    },
    {
      id: 'p2',
      name: 'Nexus Book 16"',
      price: '$1299',
      img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop',
      selected: true,
    },
    {
      id: 'p3',
      name: 'Chronos Smartwatch',
      price: '$349',
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
      selected: true,
    },
    {
      id: 'p4',
      name: 'Tactile Pro Keyboard',
      price: '$149',
      img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=400&auto=format&fit=crop',
      selected: true,
    },
  ]);

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

    // Resolve store slug (from query param -> localStorage -> fallback 'layali')
    const slug =
      this.route.snapshot.queryParamMap.get('slug') ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('current_store_slug') || localStorage.getItem('store_slug')
        : null) ||
      'layali';

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
            imageUrl: data.hero.imageUrl || this.heroImageUrl(),
            headline: data.hero.headline || this.heroTitle(),
            subtitle: data.hero.subtitle || this.heroSubtitle(),
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

        // Hydrate featured categories if available and user hasn't edited categories locally
        if (isClean && data.featuredCategories && data.featuredCategories.length > 0) {
          // TODO: API featuredCategories provides imageUrl, which needs reconciling with local emoji-icon Category model once a categories write endpoint exists.
          const hydratedCategories: Category[] = data.featuredCategories.map((fc, idx) => ({
            id: fc.slug || `cat-${idx}`,
            name: fc.name,
            icon: '📦',
          }));
          this.categories.set(hydratedCategories);
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
