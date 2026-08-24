import { CdkStepHeader, StepState } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCircleAlert, lucidePencil } from '@ng-icons/lucide';
import { HlmStyleService } from '@spartan/styles';
import { buttonVariantsByStyle } from '@spartan/styles';
import type { HlmStyle } from '@spartan/styles';
import { SpartanStepLabel } from './spartan-step-label';
import { SpartanStepperLabelPosition } from './spartan-stepper';
import { injectSpartanStepperConfig } from './stepper.token';

export type SpartanStepperIndicatorMode = 'number' | 'state' | 'icon';

@Component({
  selector: 'spartan-step-header',
  imports: [NgTemplateOutlet, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideCircleAlert, lucidePencil })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './spartan-step-header.css',
  host: {
    class:
      'group inline-flex shrink-0 outline-none items-center gap-2 touch-manipulation transition-opacity data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
    '[class.flex-col]': 'labelPosition() === "bottom"',
    '[class.text-center]': 'labelPosition() === "bottom"',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <span aria-hidden="true" [class]="_indicatorClass()" [class.glow-pulse]="selected()">
      @if (_iconName(); as icon) {
        <ng-icon [name]="icon" />
      } @else {
        <span>{{ index() + 1 }}</span>
      }
    </span>

    <span
      class="flex min-w-0 touch-manipulation flex-col truncate text-sm font-medium"
      [class.text-destructive]="state() === 'error'"
    >
      @if (_templateLabel(); as templateLabel) {
        <ng-container [ngTemplateOutlet]="templateLabel.template" />
      } @else if (_stringLabel(); as stringLabel) {
        {{ stringLabel }}
      }

      @if (_showOptionalLabel()) {
        <span class="text-muted-foreground text-xs">Optional</span>
      }

      @if (_showErrorLabel()) {
        <span class="text-destructive text-xs">{{ errorMessage() }}</span>
      }
    </span>
  `,
})
export class SpartanStepHeader extends CdkStepHeader {
  protected readonly _config = injectSpartanStepperConfig();

  public readonly state = input<StepState>('number');
  public readonly label = input<SpartanStepLabel | string | null>(null);
  public readonly errorMessage = input('');
  public readonly index = input(0, { transform: numberAttribute });
  public readonly selected = input(false, { transform: booleanAttribute });
  public readonly reached = input(false, { transform: booleanAttribute });
  public readonly active = input(false, { transform: booleanAttribute });
  public readonly optional = input(false, { transform: booleanAttribute });
  public readonly disabled = input(false, { transform: booleanAttribute });
  public readonly icon = input<string | null>(null);
  public readonly indicatorMode = input<SpartanStepperIndicatorMode>(
    this._config.defaultIndicatorMode,
  );
  public readonly labelPosition = input<SpartanStepperLabelPosition>('end');

  protected readonly _stringLabel = computed(() => {
    const label = this.label();
    return typeof label === 'string' ? label : null;
  });

  protected readonly _templateLabel = computed(() => {
    const label = this.label();
    return label instanceof SpartanStepLabel ? label : null;
  });

  protected readonly _showOptionalLabel = computed(
    () => this.optional() && this.state() !== 'error',
  );
  protected readonly _showErrorLabel = computed(
    () => this.state() === 'error' && !!this.errorMessage(),
  );

  // --- New code ---
  private readonly styleService = inject(HlmStyleService);

  protected readonly _resolvedStyle = computed<HlmStyle>(() => this.styleService.style());

  protected readonly _buttonVariant = computed<string>(() => {
    if (this.state() === 'error') {
      return 'destructive';
    }
    if (this.state() === 'done') {
      return 'default';
    }
    return 'outline';
  });

  protected readonly _iconName = computed(() => {
    const stepState = this.state();
    const mode = this.indicatorMode();

    if (mode === 'number') {
      return null;
    }

    if (stepState === 'error') {
      return 'lucideCircleAlert';
    }

    if (stepState === 'done') {
      return 'lucideCheck';
    }

    return null;
  });

  protected readonly _indicatorClass = computed(() =>
    buttonVariantsByStyle[this._resolvedStyle()]({
      variant: this._buttonVariant(),
      size: 'icon-sm',
    }),
  );
  // --- End of new code ---
}
