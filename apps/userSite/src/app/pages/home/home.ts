import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideCircleHelp,
  lucidePackage,
  lucideRefreshCw,
  lucideShieldCheck,
  lucideStore,
  lucideTag,
} from '@ng-icons/lucide';
import { LocaleService, TranslatePipe } from '@invento/core';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { ErrorState } from '@invento/shared-ui-error-state';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';

import { ProductCard } from '@invento/user-site/app/features/product';
import { StoreService } from '@invento/user-site/app/core/service/store.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { animateOnScroll } from '@invento/user-site/app/core/utils/animation.utils';

/**
 * Registered once at module load rather than inside a render hook.
 *
 * Every animation below passes `scrollTrigger`, so registering from one hook left the
 * others racing it — whichever ran first silently lost its ScrollTrigger. `register()`
 * guards its own DOM access (`_windowExists() && window.document`), so this is safe under
 * SSR even though the module is evaluated on the server.
 */
gsap.registerPlugin(ScrollTrigger);

/** Shared entrance feel, so the three sections stay visually consistent. */
const ENTRANCE = { duration: 0.6, ease: 'power3.out' } as const;

/**
 * Boilerplate CTA wording, lowercased. A store carrying one of these has not really chosen a
 * label, so it is safe to show the shopper's own language instead.
 */
const GENERIC_CTA_LABELS = new Set(['shop now', 'shop', 'buy now', 'browse']);

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HlmButton,
    HlmCard,
    HlmBadge,
    ...HlmTypographyImports,
    NgIconComponent,
    ProductCard,
    TranslatePipe,
    SkeletonBlock,
    EmptyState,
    ErrorState,
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideTag,
      lucideShieldCheck,
      lucidePackage,
      lucideCircleHelp,
      lucideRefreshCw,
      // `app-empty-state` has no providers of its own; ng-icons resolves the name it is
      // given from the consuming injector, so the icon must be registered here.
      lucideStore,
    }),
  ],
  templateUrl: './home.html',
})
export class HomeComponent {
  protected readonly storeService = inject(StoreService);
  private readonly locale = inject(LocaleService);

  /**
   * The landing page is owner-curated per store: hero copy, featured categories and featured
   * products all come from `GET /site/:slug`. It used to render a hardcoded consumer-tech
   * hero ("Elevate Your Tech Experience") and six hardcoded tech categories, which were wrong
   * for every store that is not a gadget shop.
   */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  protected readonly hero = this.storeService.hero;
  protected readonly categories = this.storeService.featuredCategories;
  protected readonly featuredProducts = this.storeService.featuredProducts;

  protected readonly isLoading = this.storeService.isLoading;
  protected readonly error = this.storeService.error;
  protected readonly storeDescription = computed(() =>
    (this.storeService.store()?.description ?? '').trim(),
  );

  /**
   * Featured content is opt-in per store (the backend only returns items the owner flagged),
   * so "nothing featured" is a normal state, not a failure — without this the page was a hero
   * followed by dead space and no route into the catalogue.
   */
  protected readonly hasFeaturedContent = computed(
    () => this.categories().length > 0 || this.featuredProducts().length > 0,
  );

  protected readonly heroCtaLink = computed(
    () => this.hero()?.ctaHref || `/${this.storeSlug()}/products`,
  );

  /**
   * Owner-authored CTA text is left exactly as written — only the generic default is translated.
   *
   * `ctaLabel` is a plain string on the store row, so `ctaLabel || ('home.shop_now' | translate)`
   * never reached the fallback and the button stayed English while the rest of the page
   * switched to Arabic. But the label is store content, not a UI string: if the owner wrote
   * "Discover the collection" it must survive verbatim. Only the boilerplate "Shop now" the
   * store was seeded with is a UI action in disguise, so only that is swapped.
   */
  protected readonly heroCtaLabel = computed(() => {
    const authored = this.hero()?.ctaLabel?.trim();
    if (!authored) return this.locale.translate('home.shop_now');
    return GENERIC_CTA_LABELS.has(authored.toLowerCase())
      ? this.locale.translate('home.shop_now')
      : authored;
  });

  /**
   * Scoped view queries instead of `document.querySelectorAll`.
   *
   * The global lookup matched `.product-card` anywhere in the document, so it could animate
   * cards belonging to other components; these resolve only within this template.
   */
  private readonly heroSection = viewChild<ElementRef<HTMLElement>>('heroSection');
  private readonly heroItems = viewChildren<ElementRef<HTMLElement>>('heroItem');
  private readonly categorySection = viewChild<ElementRef<HTMLElement>>('categorySection');
  private readonly categoryCards = viewChildren<ElementRef<HTMLElement>>('categoryCard');
  private readonly productsSection = viewChild<ElementRef<HTMLElement>>('productsSection');
  private readonly productCards = viewChildren<ElementRef<HTMLElement>>('productCard');

  constructor() {
    effect(() => this.storeService.load(this.storeSlug()));

    /**
     * `afterRenderEffect`, not `effect`.
     *
     * A plain `effect` runs on the server too. The previous version scheduled a
     * `setTimeout(…, 50)` from one, which fired after the SSR response had been sent and
     * crashed the Node process with `ReferenceError: document is not defined`. After-render
     * hooks never run during SSR and are already past render, so the timer that was there to
     * "wait for the DOM" is gone as well. They stay reactive, so each still re-runs when its
     * content arrives from the API.
     */
    animateOnScroll(this.heroSection, this.heroItems, (items, section) =>
      gsap.from(items, {
        scrollTrigger: { trigger: section, start: 'top 80%' },
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ...ENTRANCE,
        duration: 0.8,
      }),
    );

    animateOnScroll(this.categorySection, this.categoryCards, (cards, section) =>
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0, scale: 0.8 },
        {
          scrollTrigger: { trigger: section, start: 'top 85%' },
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: 'back.out(1.5)',
          clearProps: 'transform,opacity',
        },
      ),
    );

    animateOnScroll(this.productsSection, this.productCards, (cards, section) =>
      gsap.from(cards, {
        scrollTrigger: { trigger: section, start: 'top 85%' },
        y: 40,
        opacity: 0,
        stagger: 0.15,
        ...ENTRANCE,
      }),
    );
  }

  protected retry(): void {
    this.storeService.retry(this.storeSlug());
  }
}
