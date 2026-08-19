import {
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  viewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import gsap from 'gsap';

// Spartan UI Imports
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmAccordionImports } from '@spartan/helm/accordion';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { EmptyState, ErrorState, SearchInput, SkeletonBlock } from '@invento/shared';
import { TranslatePipe } from '@invento/core';

// Icons
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideHelpCircle,
  lucidePackage,
  lucideTruck,
  lucideCreditCard,
  lucideShield,
  lucideHeadphones,
  lucideSearch,
  lucideX,
  lucideRefreshCw,
  lucideAlertCircle,
  lucideSparkles,
  lucideMessageCircleQuestion,
} from '@ng-icons/lucide';

// Feature
import { FaqDataService } from '@invento/user-site/app/features/faq';
import type { FaqCategory, FaqItem } from '@invento/user-site/app/features/faq';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { StoreService } from '@invento/user-site/app/core/service/store.service';
import { animateElementsOnRender } from '@invento/user-site/app/core/utils/animation.utils';

@Component({
  selector: 'app-faq',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    HlmBadge,
    HlmButton,
    NgIconComponent,
    HlmAccordionImports,
    ...HlmTypographyImports,
    EmptyState,
    ErrorState,
    SearchInput,
    SkeletonBlock,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideHelpCircle,
      lucidePackage,
      lucideTruck,
      lucideCreditCard,
      lucideShield,
      lucideHeadphones,
      lucideSearch,
      lucideX,
      lucideRefreshCw,
      lucideAlertCircle,
      lucideSparkles,
      lucideMessageCircleQuestion,
    }),
  ],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class FaqComponent {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private readonly faqDataService = inject(FaqDataService);
  private readonly route = inject(ActivatedRoute);
  protected readonly storeService = inject(StoreService);

  readonly activeCategory = signal<string>('general');
  readonly searchQuery = signal<string>('');
  readonly openFaqIdentifier = signal<string | null>(null);

  readonly faqs = this.faqDataService.faqs;
  readonly isLoading = this.faqDataService.isLoading;
  readonly error = this.faqDataService.error;
  readonly totalQuestions = this.faqDataService.totalQuestions;

  /**
   * Group FAQ items into categories.
   * If items contain a category from backend, they are grouped by that category.
   * Otherwise, all items are displayed under the default "General" category until backend categorization is ready.
   */
  readonly categories = computed<readonly FaqCategory[]>(() => {
    const allItems = this.faqs();
    if (allItems.length === 0) {
      return [];
    }

    const categoryMap = new Map<string, FaqItem[]>();

    for (const item of allItems) {
      const catKey = item.category?.trim().toLowerCase() || 'general';
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, []);
      }
      categoryMap.get(catKey)!.push(item);
    }

    const iconMap: Record<string, string> = {
      general: 'lucideHelpCircle',
      orders: 'lucidePackage',
      shipping: 'lucideTruck',
      payments: 'lucideCreditCard',
      returns: 'lucideShield',
      support: 'lucideHeadphones',
    };

    return Array.from(categoryMap.entries()).map(([key, items]) => ({
      id: key,
      title: key.charAt(0).toUpperCase() + key.slice(1),
      icon: iconMap[key] || 'lucideHelpCircle',
      items,
    }));
  });

  /**
   * Categories filtered by the active search query (matches question or answer).
   */
  readonly filteredCategories = computed<readonly FaqCategory[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const cats = this.categories();

    if (!query) {
      return cats;
    }

    return cats
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  });

  /**
   * Active category details.
   */
  readonly activeCategoryData = computed<FaqCategory | undefined>(() => {
    const cats = this.filteredCategories();
    return cats.find((c) => c.id === this.activeCategory()) ?? cats[0];
  });

  /**
   * Items inside the currently active category.
   */
  readonly activeFaqItems = computed<readonly FaqItem[]>(() => {
    return this.activeCategoryData()?.items ?? [];
  });

  /**
   * Scoped view query instead of `document.querySelectorAll`.
   *
   * The global lookup matched `.faq-hero-anim` anywhere in the document, so it could animate
   * elements belonging to another component; this resolves only within this template.
   */
  private readonly heroAnimItems = viewChildren<ElementRef<HTMLElement>>('faqHeroAnim');

  private currentStoreSlug = '';

  constructor() {
    this.currentStoreSlug =
      this.route.snapshot.paramMap.get('storeSlug') ??
      this.route.parent?.snapshot.paramMap.get('storeSlug') ??
      this.resolvedStoreSlug();

    this.faqDataService.loadFaqs(this.currentStoreSlug);

    /**
     * `afterRenderEffect` (via `animateElementsOnRender`), not `afterNextRender`.
     *
     * The previous `afterNextRender` + `document.querySelectorAll` fired once with no
     * cleanup, so the tween leaked when this component was destroyed. `animateElementsOnRender`
     * disposes it via `onCleanup` and stays reactive if the targets show up later.
     */
    animateElementsOnRender(this.heroAnimItems, (items) =>
      gsap.from(items, {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      }),
    );
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        this.openFaqIdentifier.set(fragment);
        this.expandFaqCategory(fragment);
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.openFaqIdentifier.set(params['q']);
        this.expandFaqCategory(params['q']);
      }
    });

    effect(() => {
      const allFaqs = this.faqs();
      const identifier = this.openFaqIdentifier();
      if (allFaqs.length > 0 && identifier) {
        this.expandFaqCategory(identifier);
      }
    });

    afterNextRender(() => {
      const heroAnim = document.querySelectorAll('.faq-hero-anim');
      if (heroAnim.length > 0) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from(heroAnim, {
          y: 25,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
        });
      }
    });
  }

  setCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);

    // If current category has no matches, auto-switch to first matching category
    const cats = this.filteredCategories();
    if (cats.length > 0) {
      const currentStillExists = cats.some((c) => c.id === this.activeCategory());
      if (!currentStillExists) {
        this.activeCategory.set(cats[0].id);
      }
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onRetry(): void {
    this.faqDataService.loadFaqs(this.currentStoreSlug);
  }
}
