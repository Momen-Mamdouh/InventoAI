import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  input,
} from '@angular/core';

@Component({
  selector: 'app-typing-text',
  templateUrl: './typing-text.html',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypingText implements OnInit, OnDestroy {
  public readonly words = input<string[]>(['Your Business']);
  public readonly typingSpeed = input<number>(100);
  public readonly deletingSpeed = input<number>(60);
  public readonly pauseAfterType = input<number>(1800);
  public readonly pauseAfterDelete = input<number>(400);
  public readonly fontSizeClasses = input<string>('text-4xl md:text-5xl lg:text-6xl');

  protected readonly displayText = signal<string>('');
  protected readonly showCursor = signal<boolean>(true);

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
    const words = this.words();
    const currentWord = words[this._wordIndex];

    if (!this._isDeleting) {
      // Typing
      this._charIndex++;
      this.displayText.set(currentWord.substring(0, this._charIndex));

      if (this._charIndex === currentWord.length) {
        // Finished typing — pause then delete
        this._timeout = setTimeout(() => {
          this._isDeleting = true;
          this._startTyping();
        }, this.pauseAfterType());
        return;
      }
    } else {
      // Deleting
      this._charIndex--;
      this.displayText.set(currentWord.substring(0, this._charIndex));

      if (this._charIndex === 0) {
        // Finished deleting — move to next word
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
