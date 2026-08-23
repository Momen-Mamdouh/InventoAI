import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlert, HlmAlertDescription, HlmAlertTitle } from '@spartan/helm/alert';

/**
 * Destructive-variant error panel with an optional projected retry action.
 *
 * Replaces the hand-rolled error blocks in `faq` and `orders`, which hardcoded `rose-500`
 * and therefore ignored the active theme. Uses semantic Spartan tokens instead, so it
 * follows light/dark and any future palette change automatically.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [NgIcon, HlmAlert, HlmAlertTitle, HlmAlertDescription],
  providers: [provideIcons({ lucideCircleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmAlert variant="destructive" class="flex flex-col items-center gap-3 py-8 text-center">
      <div
        class="bg-destructive/10 text-destructive flex h-14 w-14 items-center justify-center rounded-full"
      >
        <ng-icon [name]="icon()" size="24" />
      </div>
      <h3 hlmAlertTitle class="text-foreground text-lg font-bold">{{ title() }}</h3>
      @if (message()) {
        <p hlmAlertDescription class="text-muted-foreground mx-auto max-w-sm text-sm">
          {{ message() }}
        </p>
      }
      <div class="mt-2 empty:hidden">
        <ng-content />
      </div>
    </div>
  `,
})
export class ErrorState {
  public readonly icon = input<string>('lucideCircleAlert');
  public readonly title = input<string>('Something went wrong');
  public readonly message = input<string>('');
}
