import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { LocaleService } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-ai-loader',
  templateUrl: './ai-loader.html',
  styleUrl: './ai-loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiLoader implements OnInit, OnDestroy {
  private readonly _localeService = inject(LocaleService);

  isNavigating = input(false);
  words = input(['loading_analyzing', 'loading_generating', 'loading_polishing']);
  protected readonly _translatedWords = computed(() =>
    this.words().map((w) => this._localeService.translate(w)),
  );
  typingSpeed = input(100);
  deletingSpeed = input(60);
  pauseAfterType = input(1800);
  pauseAfterDelete = input(400);

  protected readonly displayText = signal('');
  protected readonly showCursor = signal(true);

  private _wordIndex = 0;
  private _charIndex = 0;
  private _isDeleting = false;
  private _timeout: ReturnType<typeof setTimeout> | null = null;
  private _cursorInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this._startTyping();
    this._startCursorBlink();
  }

  ngOnDestroy(): void {
    if (this._timeout) clearTimeout(this._timeout);
    if (this._cursorInterval) clearInterval(this._cursorInterval);
  }

  private _startCursorBlink(): void {
    this._cursorInterval = setInterval(() => {
      this.showCursor.update((v) => !v);
    }, 530);
  }

  private _startTyping(): void {
    const words = this._translatedWords();
    const currentWord = words[this._wordIndex];

    if (!this._isDeleting) {
      this._charIndex++;
      this.displayText.set(currentWord.substring(0, this._charIndex));

      if (this._charIndex === currentWord.length) {
        this._timeout = setTimeout(() => {
          this._isDeleting = true;
          this._startTyping();
        }, this.pauseAfterType());
        return;
      }
    } else {
      this._charIndex--;
      this.displayText.set(currentWord.substring(0, this._charIndex));

      if (this._charIndex === 0) {
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
