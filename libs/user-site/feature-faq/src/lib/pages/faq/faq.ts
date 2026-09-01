import {
  Component,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  viewChildren,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import gsap from 'gsap';

// Spartan UI Imports
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmAccordionImports } from '@spartan/helm/accordion';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmSeparator } from '@spartan/helm/separator';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { ErrorState } from '@invento/shared-ui-error-state';
import { SearchInput } from '@invento/shared-ui-search-input';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { TranslatePipe } from '@invento/shared-util-i18n';

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
import { FaqDataService } from '../../services';
import type { FaqCategory, FaqItem } from '../../types';
import { StoreSlugService, StoreService } from '@invento/user-site-data-access-store';
import { animateElementsOnRender } from '@invento/user-site-util-animation';

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
    HlmSeparator,
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
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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
    // `/faq#some-id` and `/faq?q=some-id` both deep-link to a single question.
    // takeUntilDestroyed because route observables outlive this component.
    this.route.fragment.pipe(takeUntilDestroyed()).subscribe((fragment) => {
      if (fragment) this.openFaqIdentifier.set(fragment);
    });

    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params['q']) this.openFaqIdentifier.set(params['q']);
    });

    // The target's category is only knowable once the FAQs have loaded, and the
    // identifier can arrive before or after them — so this reacts to both rather
    // than being called from each subscription.
    effect(() => {
      const identifier = this.openFaqIdentifier();
      if (this.faqs().length > 0 && identifier) {
        this.expandFaqCategory(identifier);
      }
    });
  }

  setCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
    // A deep-linked question belongs to the category we just left; clearing it
    // stops that item from staying force-opened in every category afterwards.
    this.openFaqIdentifier.set(null);
  }

  /** True for the question a `#fragment` or `?q=` deep link points at. */
  isDeepLinked(item: FaqItem): boolean {
    const identifier = this.openFaqIdentifier();
    return identifier !== null && (item.id === identifier || item.question === identifier);
  }

  /**
   * Reveals the question a deep link names: switches to its category, then
   * scrolls it into view.
   *
   * Matches on id or question text because both forms appear in links — the
   * chatbot cites questions by text, while the dashboard links by id.
   */
  private expandFaqCategory(identifier: string): void {
    const item = this.faqs().find((f) => f.id === identifier || f.question === identifier);
    if (!item) return;

    this.activeCategory.set(item.category?.trim().toLowerCase() || 'general');

    // Browser-only: this runs from an effect, which also executes during SSR,
    // where `document` does not exist.
    if (!this.isBrowser) return;

    // The category switch has to render before the target element exists.
    afterNextRender(
      {
        read: () => {
          const index = this.activeFaqItems().findIndex(
            (f) => f.id === identifier || f.question === identifier,
          );
          if (index < 0) return;
          document
            .getElementById(item.id || `faq-${index}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
      },
      { injector: this.injector },
    );
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
