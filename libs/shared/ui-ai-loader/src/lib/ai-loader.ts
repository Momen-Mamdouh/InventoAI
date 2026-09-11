import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { LocaleService } from '@invento/shared-util-i18n';

/**
 * Reconciled from site-builder's fork (T167) — its typewriter-animated, `isNavigating`-gated SVG
 * "N"-mark overlay replaced the earlier stub's plain CSS spinner, which had no inputs and no
 * consumer.
 */
@Component({
  selector: 'app-ai-loader',
  templateUrl: './ai-loader.html',
  styleUrl: './ai-loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiLoader implements OnDestroy {
  private readonly _localeService = inject(LocaleService);

  readonly isNavigating = input(false);
  readonly words = input(['loading_analyzing', 'loading_generating', 'loading_polishing']);
  protected readonly _translatedWords = computed(() =>
    this.words().map((w) => this._localeService.translate(w)),
  );
  readonly typingSpeed = input(100);
  readonly deletingSpeed = input(60);
  readonly pauseAfterType = input(1800);
  readonly pauseAfterDelete = input(400);

  protected readonly displayText = signal('');
  protected readonly showCursor = signal(true);
  protected readonly showOverlay = signal(false);
  protected readonly isFadingOut = signal(false);

  private _wordIndex = 0;
  private _charIndex = 0;
  private _isDeleting = false;
  private _timeout: ReturnType<typeof setTimeout> | null = null;
  private _cursorInterval: ReturnType<typeof setInterval> | null = null;
  private _fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const navigating = this.isNavigating();
      if (navigating) {
        if (this._fadeTimeout) {
          clearTimeout(this._fadeTimeout);
          this._fadeTimeout = null;
        }
        this.isFadingOut.set(false);
        this.showOverlay.set(true);
        this._wordIndex = 0;
        this._charIndex = 0;
        this._isDeleting = false;
        this.displayText.set('');
        this._clearTyping();
        this._startTyping();
        this._startCursorBlink();
      } else if (this.showOverlay()) {
        this.isFadingOut.set(true);
        this._clearTyping();
        this._fadeTimeout = setTimeout(() => {
          this.showOverlay.set(false);
          this.isFadingOut.set(false);
        }, 300);
      }
    });
  }

  ngOnDestroy(): void {
    this._clearTyping();
    if (this._fadeTimeout) {
      clearTimeout(this._fadeTimeout);
    }
  }

  private _clearTyping(): void {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    if (this._cursorInterval) {
      clearInterval(this._cursorInterval);
      this._cursorInterval = null;
    }
  }

  private _startCursorBlink(): void {
    if (this._cursorInterval) {
      clearInterval(this._cursorInterval);
    }
    this._cursorInterval = setInterval(() => {
      this.showCursor.update((v) => !v);
    }, 530);
  }

  private _startTyping(): void {
    const words = this._translatedWords();
    if (words.length === 0) return;
    const currentWord = words[this._wordIndex] ?? '';

    if (!this._isDeleting) {
      this._charIndex++;
      this.displayText.set(currentWord.substring(0, this._charIndex));

      if (this._charIndex >= currentWord.length) {
        this._timeout = setTimeout(() => {
          this._isDeleting = true;
          this._startTyping();
        }, this.pauseAfterType());
        return;
      }
    } else {
      this._charIndex--;
      this.displayText.set(currentWord.substring(0, this._charIndex));

      if (this._charIndex <= 0) {
        this._isDeleting = false;
        this._wordIndex = (this._wordIndex + 1) % words.length;
        this._timeout = setTimeout(() => {
          this._startTyping();
        }, this.pauseAfterDelete());
        return;
      }
    }

    const speed = this._isDeleting ? this.deletingSpeed() : this.typingSpeed();
    this._timeout = setTimeout(() => this._startTyping(), speed);
  }
}