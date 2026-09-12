import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { HlmButton } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmInput } from '@spartan/helm/input';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { toast } from '@spartan/helm/sonner';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBadgeCheck,
  lucideCheck,
  lucideCircleHelp,
  lucideMail,
  lucidePackage,
  lucideQuote,
  lucideRefreshCw,
  lucideSend,
  lucideShieldCheck,
  lucideShoppingBag,
  lucideShoppingCart,
  lucideSparkles,
  lucideStore,
  lucideTag,
  lucideTruck,
} from '@ng-icons/lucide';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { FilterTabs, FilterTab } from '@invento/shared-ui-filter-tabs';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { ErrorState } from '@invento/shared-ui-error-state';

import {
  StorefrontHomeHero,
  StorefrontHomeCategory,
  StorefrontHomeProduct,
} from '../storefront-home.interface';

gsap.registerPlugin(ScrollTrigger);

const ENTRANCE = { duration: 0.6, ease: 'power3.out' } as const;
const GENERIC_CTA_LABELS = new Set(['shop now', 'shop', 'buy now', 'browse']);

@Component({
  selector: 'app-storefront-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CurrencyPipe,
    HlmButton,
    HlmBadge,
    ...HlmCardImports,
    HlmInput,
    ...HlmTypographyImports,
    NgIconComponent,
    FilterTabs,
    TranslatePipe,
    SkeletonBlock,
    ErrorState,
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideBadgeCheck,
      lucideCheck,
      lucideCircleHelp,
      lucideMail,
      lucidePackage,
      lucideQuote,
      lucideRefreshCw,
      lucideSend,
      lucideShieldCheck,
      lucideShoppingBag,
      lucideShoppingCart,
      lucideSparkles,
      lucideStore,
      lucideTag,
      lucideTruck,
    }),
  ],
  templateUrl: './storefront-home.html',
  styleUrl: './storefront-home.css',
})
export class StorefrontHome {
  private readonly locale = inject(LocaleService);

  // Inputs
  readonly hero = input<StorefrontHomeHero | null | undefined>(null);
  readonly categories = input<readonly StorefrontHomeCategory[]>([]);
  readonly products = input<readonly StorefrontHomeProduct[]>([]);
  readonly storeSlug = input<string>('');
  readonly storeName = input<string>('');
  readonly storeDescription = input<string>('');
  readonly currency = input<string>('USD');
  readonly isPreview = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);

  // Outputs
  readonly retry = output<void>();
  readonly addToCart = output<StorefrontHomeProduct>();
  readonly productClick = output<StorefrontHomeProduct>();
  readonly categoryClick = output<StorefrontHomeCategory>();

  // Internal Filter & Form Signals
  readonly selectedCategory = signal<string>('all');
  readonly newsletterEmail = signal<string>('');
  readonly isSubscribed = signal<boolean>(false);
  readonly isSubmittingNewsletter = signal<boolean>(false);

  readonly hasFeaturedContent = computed<boolean>(
    () => this.categories().length > 0 || this.products().length > 0,
  );

  readonly heroCtaLink = computed<string>(
    () => this.hero()?.ctaHref || `/${this.storeSlug()}/products`,
  );

  readonly heroCtaLabel = computed<string>(() => {
    const authored = this.hero()?.ctaLabel?.trim();
    if (!authored) {
      return this.locale.translate('home.shop_now');
    }
    return GENERIC_CTA_LABELS.has(authored.toLowerCase())
      ? this.locale.translate('home.shop_now')
      : authored;
  });

  readonly categoryTabs = computed<readonly FilterTab[]>(() => {
    const cats = this.categories();
    const prods = this.products();
    const tabs: FilterTab[] = [
      { id: 'all', label: this.locale.translate('home.all_filter'), count: prods.length },
    ];
    for (const cat of cats) {
      const slug = cat.slug || cat.id || '';
      const count = prods.filter((p) =>
        p.categories?.some((c) => c.slug === slug),
      ).length;
      tabs.push({ id: slug, label: cat.name, count });
    }
    return tabs;
  });

  readonly hasMultipleCategories = computed<boolean>(
    () => this.categories().length > 1 && this.products().length > 0,
  );

  readonly filteredProducts = computed<readonly StorefrontHomeProduct[]>(() => {
    const active = this.selectedCategory();
    const prods = this.products();
    if (active === 'all') {
      return prods;
    }
    const filtered = prods.filter((p) =>
      p.categories?.some((c) => c.slug === active),
    );
    return filtered.length > 0 ? filtered : prods;
  });

  // Scoped view queries for scroll animations
  private readonly heroSection = viewChild<ElementRef<HTMLElement>>('heroSection');
  private readonly heroItems = viewChildren<ElementRef<HTMLElement>>('heroItem');
  private readonly trustSection = viewChild<ElementRef<HTMLElement>>('trustSection');
  private readonly trustCards = viewChildren<ElementRef<HTMLElement>>('trustCard');
  private readonly categorySection = viewChild<ElementRef<HTMLElement>>('categorySection');
  private readonly categoryCards = viewChildren<ElementRef<HTMLElement>>('categoryCard');
  private readonly storySection = viewChild<ElementRef<HTMLElement>>('storySection');
  private readonly storyItems = viewChildren<ElementRef<HTMLElement>>('storyItem');
  private readonly productsSection = viewChild<ElementRef<HTMLElement>>('productsSection');
  private readonly productCards = viewChildren<ElementRef<HTMLElement>>('productCard');
  private readonly promoSection = viewChild<ElementRef<HTMLElement>>('promoSection');
  private readonly promoItems = viewChildren<ElementRef<HTMLElement>>('promoItem');
  private readonly newsletterSection = viewChild<ElementRef<HTMLElement>>('newsletterSection');
  private readonly newsletterItems = viewChildren<ElementRef<HTMLElement>>('newsletterItem');

  constructor() {
    afterRenderEffect((onCleanup) => {
      // In preview mode inside the dashboard editor, skip GSAP scroll triggers to guarantee instant reactivity
      if (this.isPreview()) {
        return;
      }

      const cleanups: (() => void)[] = [];

      const animateGroup = (
        sectionRef: ElementRef<HTMLElement> | undefined,
        itemsRefs: readonly ElementRef<HTMLElement>[],
        animator: (targets: HTMLElement[], trigger: HTMLElement) => gsap.core.Tween,
      ): void => {
        const trigger = sectionRef?.nativeElement;
        const targets = itemsRefs.map((r) => r.nativeElement);
        if (trigger && targets.length > 0) {
          const tween = animator(targets, trigger);
          cleanups.push(() => {
            tween.scrollTrigger?.kill();
            tween.kill();
          });
        }
      };

      animateGroup(this.heroSection(), this.heroItems(), (targets, trigger) =>
        gsap.from(targets, {
          scrollTrigger: { trigger, start: 'top 80%' },
          y: 25,
          opacity: 0,
          stagger: 0.1,
          ...ENTRANCE,
          duration: 0.8,
        }),
      );

      animateGroup(this.trustSection(), this.trustCards(), (targets, trigger) =>
        gsap.from(targets, {
          scrollTrigger: { trigger, start: 'top 85%' },
          y: 25,
          opacity: 0,
          stagger: 0.08,
          ...ENTRANCE,
        }),
      );

      animateGroup(this.categorySection(), this.categoryCards(), (targets, trigger) =>
        gsap.fromTo(
          targets,
          { y: 30, opacity: 0 },
          {
            scrollTrigger: { trigger, start: 'top 85%' },
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        ),
      );

      animateGroup(this.storySection(), this.storyItems(), (targets, trigger) =>
        gsap.from(targets, {
          scrollTrigger: { trigger, start: 'top 85%' },
          y: 30,
          opacity: 0,
          ...ENTRANCE,
        }),
      );

      animateGroup(this.productsSection(), this.productCards(), (targets, trigger) =>
        gsap.from(targets, {
          scrollTrigger: { trigger, start: 'top 85%' },
          y: 30,
          opacity: 0,
          stagger: 0.08,
          ...ENTRANCE,
        }),
      );

      animateGroup(this.promoSection(), this.promoItems(), (targets, trigger) =>
        gsap.from(targets, {
          scrollTrigger: { trigger, start: 'top 85%' },
          y: 30,
          opacity: 0,
          ...ENTRANCE,
        }),
      );

      animateGroup(this.newsletterSection(), this.newsletterItems(), (targets, trigger) =>
        gsap.from(targets, {
          scrollTrigger: { trigger, start: 'top 85%' },
          y: 30,
          opacity: 0,
          ...ENTRANCE,
        }),
      );

      onCleanup(() => {
        for (const cleanup of cleanups) {
          cleanup();
        }
      });
    });
  }

  protected onRetry(): void {
    this.retry.emit();
  }

  protected onSelectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  protected onLinkClick(event: MouseEvent): void {
    if (this.isPreview()) {
      event.preventDefault();
    }
  }

  protected onProductClick(event: MouseEvent, product: StorefrontHomeProduct): void {
    if (this.isPreview()) {
      event.preventDefault();
    }
    this.productClick.emit(product);
  }

  protected onCategoryClick(event: MouseEvent, category: StorefrontHomeCategory): void {
    if (this.isPreview()) {
      event.preventDefault();
    }
    this.categoryClick.emit(category);
  }

  protected onAddToCart(event: MouseEvent, product: StorefrontHomeProduct): void {
    if (this.isPreview()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.addToCart.emit(product);
  }

  protected onEmailInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    if (inputEl) {
      this.newsletterEmail.set(inputEl.value);
    }
  }

  protected onSubscribeNewsletter(event: Event): void {
    event.preventDefault();
    if (this.isPreview()) {
      toast.success(this.locale.translate('home.newsletter_toast_success'));
      this.isSubscribed.set(true);
      return;
    }

    const email = this.newsletterEmail().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error(this.locale.translate('home.newsletter_toast_invalid'));
      return;
    }

    this.isSubmittingNewsletter.set(true);
    setTimeout(() => {
      this.isSubmittingNewsletter.set(false);
      this.isSubscribed.set(true);
      toast.success(this.locale.translate('home.newsletter_toast_success'));
    }, 400);
  }
}
