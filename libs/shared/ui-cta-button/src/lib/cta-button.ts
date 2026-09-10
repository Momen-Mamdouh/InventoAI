import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  templateUrl: './cta-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"inline-block w-full sm:w-auto " + hostClass()',
  },
})
export class CtaButton {
  readonly text = input<string>('');
  readonly routerLink = input<string | readonly (string | number)[] | null | undefined>(null);
  readonly href = input<string | null | undefined>(null);
  readonly target = input<string | null | undefined>(null);
  readonly icon = input<string | null | undefined>(null);
  readonly iconSize = input<string>('18');
  readonly iconPosition = input<'start' | 'end'>('start');
  readonly wrapperClass = input<string>(
    'w-full sm:w-auto hover:scale-105 transition-transform !rounded-full shadow-lg shadow-primary/20',
  );
  readonly buttonClass = input<string>('');
  readonly hostClass = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string | null | undefined>(null);

  readonly clicked = output<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
