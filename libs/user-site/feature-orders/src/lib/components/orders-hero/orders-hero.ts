import { TranslatePipe } from '@invento/shared-util-i18n';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChildren,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import gsap from 'gsap';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucidePackage, lucideTruck, lucideCircleCheck, lucideDollarSign } from '@ng-icons/lucide';
import { OrdersDataService } from '@invento/user-site-data-access-order';
import { animateElementsOnRender } from '@invento/user-site-util-animation';

@Component({
  selector: 'app-orders-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CommonModule,
    CurrencyPipe,
    HlmBadgeImports,
    ...HlmTypographyImports,
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      lucidePackage,
      lucideTruck,
      lucideCircleCheck,
      lucideDollarSign,
    }),
  ],
  templateUrl: './orders-hero.html',
})
export class OrdersHero {
  protected readonly ordersService = inject(OrdersDataService);

  /**
   * Scoped view queries instead of `document.querySelectorAll`.
   *
   * The global lookup matched `.orders-hero-anim` anywhere in the document, which also
   * caught `orders-filter-bar`'s section (it reuses the same class name for its own reveal),
   * so this component's animation was reaching into a sibling component's markup. Resolving
   * only within this template fixes that and keeps the tween scoped to this instance.
   */
  private readonly heroAnimItems = viewChildren<ElementRef<HTMLElement>>('ordersHeroAnim');
  private readonly statCards = viewChildren<ElementRef<HTMLElement>>('ordersStatCard');

  constructor() {
    /**
     * `afterRenderEffect` (via `animateElementsOnRender`), not `afterNextRender`.
     *
     * The previous `afterNextRender` + `document.querySelectorAll` pair fired once with no
     * cleanup, so both tweens leaked when this component was destroyed.
     * `animateElementsOnRender` disposes each via `onCleanup`.
     */
    animateElementsOnRender(this.heroAnimItems, (items) =>
      gsap.from(items, {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
      }),
    );

    animateElementsOnRender(this.statCards, (cards) =>
      gsap.from(cards, {
        scale: 0.95,
        opacity: 0,
        stagger: 0.08,
        duration: 0.5,
        delay: 0.2,
        ease: 'back.out(1.5)',
      }),
    );
  }
}
