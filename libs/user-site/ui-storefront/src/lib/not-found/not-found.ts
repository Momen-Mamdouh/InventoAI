import { ChangeDetectionStrategy, Component, ElementRef, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

// Spartan UI Imports
import { HlmButton } from '@spartan/helm/button';

import { animateElementsOnRender } from '@invento/user-site-util-animation';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HlmButton, TranslatePipe],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  /**
   * Scoped view queries instead of `document.querySelectorAll`.
   *
   * The global lookups matched `.floating-shape`/`.content-reveal` anywhere in the document,
   * so they could animate elements belonging to another component; these resolve only within
   * this template.
   */
  private readonly floatingShapes = viewChildren<ElementRef<HTMLElement>>('floatingShape');
  private readonly contentRevealItems = viewChildren<ElementRef<HTMLElement>>('contentReveal');

  constructor() {
    /**
     * `afterRenderEffect` (via `animateElementsOnRender`), not `afterNextRender`.
     *
     * The previous `afterNextRender` + `document.querySelectorAll` pair fired once with no
     * cleanup, so both tweens (including the infinitely-repeating floating-shape one) leaked
     * when this component was destroyed. `animateElementsOnRender` disposes each via
     * `onCleanup`.
     */
    animateElementsOnRender(this.floatingShapes, (shapes) =>
      gsap.to(shapes, {
        y: 'random(-40, 40)',
        x: 'random(-40, 40)',
        rotation: 'random(-25, 25)',
        duration: 'random(3, 6)',
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.2,
      }),
    );

    animateElementsOnRender(this.contentRevealItems, (items) =>
      gsap.from(items, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.2)',
      }),
    );
  }
}
