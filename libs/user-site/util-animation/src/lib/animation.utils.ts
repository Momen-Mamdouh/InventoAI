import { ElementRef, Signal, afterRenderEffect } from '@angular/core';
import type gsap from 'gsap';

/**
 * A tween's ScrollTrigger (if it has one) outlives the tween itself, so both have to be
 * killed on cleanup or the ScrollTrigger instance leaks along with its scroll listeners.
 */
function disposeTween(tween: gsap.core.Tween): void {
  tween.scrollTrigger?.kill();
  tween.kill();
}

/**
 * Wires a GSAP entrance animation to a scoped `viewChildren` signal, SSR-safe and
 * self-cleaning.
 *
 * Must be called synchronously from a component constructor (or another injection
 * context) — it schedules an `afterRenderEffect`, which never runs during SSR (unlike a
 * plain `effect`, which does and previously crashed the server with
 * `ReferenceError: document is not defined`). The targets are resolved from Angular's own
 * `viewChildren` query instead of `document.querySelectorAll`, so the animation can never
 * pick up elements belonging to another component instance, and it stays reactive: if the
 * targets appear later (e.g. after data arrives from the API), the effect reruns and
 * animates them then.
 */
export function animateElementsOnRender(
  items: Signal<readonly ElementRef<HTMLElement>[]>,
  build: (targets: HTMLElement[]) => gsap.core.Tween,
): void {
  afterRenderEffect((onCleanup) => {
    const targets = items().map((ref) => ref.nativeElement);
    if (targets.length === 0) return;

    const tween = build(targets);
    onCleanup(() => disposeTween(tween));
  });
}

/**
 * Same as {@link animateElementsOnRender}, but also resolves a scoped `viewChild` trigger
 * element for GSAP ScrollTrigger-based animations (the pattern used in `pages/home/home.ts`).
 */
export function animateOnScroll(
  section: Signal<ElementRef<HTMLElement> | undefined>,
  items: Signal<readonly ElementRef<HTMLElement>[]>,
  build: (targets: HTMLElement[], trigger: HTMLElement) => gsap.core.Tween,
): void {
  afterRenderEffect((onCleanup) => {
    const trigger = section()?.nativeElement;
    const targets = items().map((ref) => ref.nativeElement);
    if (!trigger || targets.length === 0) return;

    const tween = build(targets, trigger);
    onCleanup(() => disposeTween(tween));
  });
}
