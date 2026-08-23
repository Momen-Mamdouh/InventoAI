import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { TranslatePipe } from '@invento/core';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import gsap from 'gsap';

// Spartan UI & Icons
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideCheckCircle,
  lucidePackage,
  lucideArrowRight,
  lucideShoppingBag,
  lucideLoader2,
} from '@ng-icons/lucide';

import { CartService } from '@invento/user-site/app/core/service/cart.service';
import { animateElementsOnRender } from '@invento/user-site/app/core/utils/animation.utils';
import { FormatOrderDatePipe } from '@invento/user-site/app/core/pipes/format-date.pipe';
import type { PlacedOrderResponse } from '@invento/user-site/app/core/interface/cart.interface';
import { OrdersDataService, type OrderDetail } from '@invento/user-site/app/features/orders';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-order-confirmed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SkeletonBlock,
    CommonModule,
    RouterLink,
    CurrencyPipe,
    HlmButton,
    HlmCard,
    ...HlmTypographyImports,
    NgIconComponent,
    FormatOrderDatePipe,
    TranslatePipe,
  ],

  providers: [
    provideIcons({
      lucideCheckCircle,
      lucidePackage,
      lucideArrowRight,
      lucideShoppingBag,
      lucideLoader2,
    }),
  ],
  templateUrl: './order-confirmed.html',
})
export class OrderConfirmedComponent implements OnInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  protected readonly cartService = inject(CartService);
  protected readonly ordersService = inject(OrdersDataService);
  private readonly route = inject(ActivatedRoute);

  readonly activeStoreSlug = computed(() => {
    return (
      this.route.snapshot.paramMap.get('storeSlug') ||
      this.route.parent?.snapshot.paramMap.get('storeSlug') ||
      this.resolvedStoreSlug()
    );
  });

  readonly order = signal<PlacedOrderResponse | OrderDetail | null>(null);
  readonly isLoading = signal<boolean>(true);

  /**
   * Scoped view queries instead of `document.querySelectorAll`.
   *
   * The global lookups matched these classes anywhere in the document, so they could pick up
   * elements belonging to another component instance; these resolve only within this template.
   */
  private readonly successCircle = viewChild<ElementRef<HTMLElement>>('successCircle');
  private readonly checkmarkPath = viewChild<ElementRef<HTMLElement>>('checkmarkPath');
  private readonly confirmAnimItems = viewChildren<ElementRef<HTMLElement>>('confirmAnim');
  private readonly timelineSteps = viewChildren<ElementRef<HTMLElement>>('timelineStep');

  constructor() {
    /**
     * `afterRenderEffect` (via `animateElementsOnRender`), not a plain `effect`.
     *
     * A plain `effect` runs on the server too, which is what previously crashed the SSR
     * process with `ReferenceError: document is not defined`. After-render hooks never run
     * during SSR, and stay reactive so each animation still fires once its target arrives
     * (e.g. the shipping-details card, which only renders once `order()` resolves).
     */
    animateElementsOnRender(this.singleAsList(this.successCircle), (circle) =>
      gsap.from(circle, {
        scale: 0,
        rotation: -45,
        duration: 0.6,
        ease: 'back.out(2)',
      }),
    );

    animateElementsOnRender(this.singleAsList(this.checkmarkPath), (path) =>
      gsap.fromTo(
        path,
        { strokeDasharray: 100, strokeDashoffset: 100 },
        {
          strokeDashoffset: 0,
          duration: 0.8,
          delay: 0.8,
          ease: 'power2.inOut',
        },
      ),
    );

    animateElementsOnRender(this.confirmAnimItems, (cards) =>
      gsap.from(cards, {
        y: 20,
        opacity: 0,
        stagger: 0.2,
        delay: 0.4,
      }),
    );

    animateElementsOnRender(this.timelineSteps, (steps) =>
      gsap.from(steps, {
        x: -10,
        opacity: 0,
        stagger: 0.15,
        delay: 0.8,
      }),
    );
  }

  ngOnInit(): void {
    const slug = this.activeStoreSlug();
    const storedLastOrder = this.cartService.lastPlacedOrder();

    if (storedLastOrder) {
      this.order.set(storedLastOrder);
      this.isLoading.set(false);
      return;
    }

    // Check query params for orderNumber
    const orderNumStr = this.route.snapshot.queryParamMap.get('orderNumber');
    if (orderNumStr) {
      const orderNum = Number(orderNumStr);
      if (!isNaN(orderNum)) {
        this.ordersService.loadOrderDetails(orderNum, slug).then((detail) => {
          if (detail) {
            this.order.set(detail);
            this.cartService.setLastPlacedOrder(detail as PlacedOrderResponse);
          }
          this.isLoading.set(false);
        });
        return;
      }
    }

    // Fallback: Fetch customer's latest order from API
    this.ordersService.getMyOrders(slug, 1, 1).subscribe({
      next: (res) => {
        const latest = res.items?.[0];
        if (latest && latest.orderNumber != null) {
          this.ordersService.loadOrderDetails(latest.orderNumber, slug).then((detail) => {
            if (detail) {
              this.order.set(detail);
              this.cartService.setLastPlacedOrder(detail as PlacedOrderResponse);
            }
            this.isLoading.set(false);
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  /** Adapts a single `viewChild` signal to the `viewChildren`-shaped list `animateElementsOnRender` expects. */
  private singleAsList(
    ref: Signal<ElementRef<HTMLElement> | undefined>,
  ): Signal<readonly ElementRef<HTMLElement>[]> {
    return computed(() => {
      const el = ref();
      return el ? [el] : [];
    });
  }
}
