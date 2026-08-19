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
import { NgClass } from '@angular/common';
import { LocaleService } from '@invento/core';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

@Component({
  selector: 'app-pro-text-anim',
  template: `
    <span class="inline-flex">
      <span class="font-mono font-bold tracking-tight" [ngClass]="fontSizeClasses()">
        {{ displayText() }}
      </span>
      <span
        class="font-mono font-bold tracking-tight"
        [ngClass]="fontSizeClasses()"
        [class.opacity-0]="!showCursor()"
        [class.opacity-100]="showCursor()"
        >_</span
      >
    </span>
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProTextAnim implements OnInit, OnDestroy {
  private readonly _localeService = inject(LocaleService);

  public readonly words = input<string[]>([]);
  public readonly fontSizeClasses = input<string>('text-4xl md:text-5xl lg:text-6xl text-primary');
  public readonly intervalTime = input<number>(3000); // Time to stay on a word
  public readonly scrambleDuration = input<number>(800); // Time it takes to scramble to next word

  protected readonly _translatedWords = computed(() =>
    this.words().map((w) => this._localeService.translate(w)),
  );

  protected readonly displayText = signal<string>('');
  protected readonly showCursor = signal<boolean>(true);

  private _currentIndex = 0;
  private _mainTimeout: ReturnType<typeof setTimeout> | null = null;
  private _cursorInterval: ReturnType<typeof setInterval> | null = null;
  private _scrambleInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this._startCursorBlink();
    const words = this._translatedWords();
    if (words.length > 0) {
      this.displayText.set(words[0]);
      this._scheduleNext();
    }
  }

  ngOnDestroy() {
    if (this._mainTimeout) clearTimeout(this._mainTimeout);
    if (this._cursorInterval) clearInterval(this._cursorInterval);
    if (this._scrambleInterval) clearInterval(this._scrambleInterval);
  }

  private _startCursorBlink() {
    this._cursorInterval = setInterval(() => {
      this.showCursor.update((v) => !v);
    }, 500);
  }

  private _scheduleNext() {
    this._mainTimeout = setTimeout(() => {
      this._scrambleToNext();
    }, this.intervalTime());
  }

  private _scrambleToNext() {
    const words = this._translatedWords();
    if (words.length <= 1) return;

    const oldWord = words[this._currentIndex];
    this._currentIndex = (this._currentIndex + 1) % words.length;
    const newWord = words[this._currentIndex];

    const length = Math.max(oldWord.length, newWord.length);
    let frame = 0;
    const totalFrames = this.scrambleDuration() / 30; // 30ms per frame

    this._scrambleInterval = setInterval(() => {
      frame++;
      let currentString = '';

      for (let i = 0; i < length; i++) {
        const lockInFrame = (i / length) * totalFrames;

        if (frame >= lockInFrame) {
          if (i < newWord.length) {
            currentString += newWord[i];
          } else {
            currentString += '';
          }
        } else {
          currentString += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
      }

      this.displayText.set(currentString);

      if (frame >= totalFrames) {
        if (this._scrambleInterval) clearInterval(this._scrambleInterval);
        this.displayText.set(newWord);
        this._scheduleNext();
      }
    }, 30);
  }
}
