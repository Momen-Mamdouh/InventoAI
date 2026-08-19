import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { LocaleService } from '@invento/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-blur-text',
  templateUrl: './blur-text.html',
  styleUrls: ['./blur-text.css'],
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlurText implements OnInit, OnDestroy {
  private readonly _localeService = inject(LocaleService);
  private _el = inject(ElementRef);

  public readonly texts = input<string[]>([]);
  public readonly rotationInterval = input<number>(3000);
  public readonly delay = input<number>(0.15); // Stagger delay in seconds
  public readonly animateBy = input<'words' | 'letters'>('words');
  public readonly direction = input<'top' | 'bottom'>('top');

  public readonly className = input<string>('');

  protected readonly currentTextIndex = signal(0);
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _animating = false;

  protected readonly _translatedTexts = computed(() =>
    this.texts().map((t) => this._localeService.translate(t)),
  );

  protected readonly currentText = computed(() => {
    const texts = this._translatedTexts();
    if (texts.length === 0) return '';
    return texts[this.currentTextIndex() % texts.length];
  });

  protected readonly elements = computed<{ text: string; needsSpace: boolean }[]>(() => {
    const text = this.currentText();
    const splitByValue = this.animateBy();

    if (splitByValue === 'words') {
      const words = text.split(' ');
      return words.map((word, i) => ({
        text: word,
        needsSpace: i !== words.length - 1,
      }));
    }

    // Letters
    const chars = Array.from(text);
    return chars.map((char) => ({
      text: char,
      needsSpace: false,
    }));
  });

  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit() {
    // GSAP needs a real DOM. On the server its CSSPlugin is absent, so every
    // tween logged "Invalid property y/opacity/filter ... Missing plugin?" and
    // the rotation interval ran for nothing during prerender.
    if (!this._isBrowser) return;

    this._startInterval();
    setTimeout(() => {
      this._animateIn();
    }, 100);
  }

  ngOnDestroy() {
    this._stopInterval();
  }

  private _startInterval() {
    this._stopInterval();
    this._intervalId = setInterval(() => {
      this.next();
    }, this.rotationInterval());
  }

  private _stopInterval() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  public next() {
    if (this._animating) return;
    const texts = this._translatedTexts();
    if (texts.length <= 1) return;

    const nextIndex = (this.currentTextIndex() + 1) % texts.length;
    this._animateOutAndIn(nextIndex);
  }

  private _animateOutAndIn(nextIndex: number) {
    this._animating = true;
    const elements = this._el.nativeElement.querySelectorAll('.blur-text-element');

    // Animate out
    gsap.to(elements, {
      y: this.direction() === 'top' ? 50 : -50,
      opacity: 0,
      filter: 'blur(10px)',
      duration: 0.35,
      stagger: this.delay(),
      ease: 'power2.in',
      onComplete: () => {
        // Swap data
        this.currentTextIndex.set(nextIndex);

        // Wait a tick for DOM to update
        setTimeout(() => {
          this._animateIn();
        }, 50);
      },
    });
  }

  private _animateIn() {
    const elements = this._el.nativeElement.querySelectorAll('.blur-text-element');

    // Set initial state
    gsap.set(elements, {
      y: this.direction() === 'top' ? -50 : 50,
      opacity: 0,
      filter: 'blur(10px)',
    });

    // Animate in using keyframes
    gsap.to(elements, {
      keyframes: [
        {
          y: this.direction() === 'top' ? 5 : -5,
          opacity: 0.5,
          filter: 'blur(5px)',
          duration: 0.15,
        },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.2 },
      ],
      stagger: this.delay(),
      ease: 'power1.out',
      onComplete: () => {
        this._animating = false;
      },
    });
  }
}
