import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  input,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AnimationType =
  | 'fade-up'
  | 'fade-left'
  | 'fade-right'
  | 'fade-in'
  | 'zoom-in'
  | 'slide-up';

@Directive({
  selector: '[appScrollAnimate]',
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  public readonly appScrollAnimate = input<AnimationType>('fade-up');
  public readonly animDelay = input<number>(0);

  private readonly _el = inject(ElementRef);
  private readonly _platformId = inject(PLATFORM_ID);
  private _observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    const el = this._el.nativeElement as HTMLElement;
    const animation = this.appScrollAnimate();
    const delay = this.animDelay();

    el.style.transition = `opacity 1.2s ease ${delay}ms, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
    el.style.opacity = '0';

    switch (animation) {
      case 'fade-up':
        el.style.transform = 'translateY(40px)';
        break;
      case 'fade-left':
        el.style.transform = 'translateX(-40px)';
        break;
      case 'fade-right':
        el.style.transform = 'translateX(40px)';
        break;
      case 'zoom-in':
        el.style.transform = 'scale(0.92)';
        break;
      case 'slide-up':
        el.style.transform = 'translateY(60px)';
        break;
      case 'fade-in':
      default:
        el.style.transform = 'none';
        break;
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            this._observer?.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );

    this._observer.observe(el);
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }
}
