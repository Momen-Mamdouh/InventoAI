import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut } from '@ng-icons/lucide';
import { AuthService } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';

/**
 * Reusable sign-out action button.
 *
 * Encapsulates sign-out invocation via AuthService, soft destructive hover styling,
 * explicit icon sizing, and internationalized labeling.
 */
@Component({
  selector: 'app-sign-out-button',
  standalone: true,
  imports: [HlmButton, NgIcon],
  providers: [provideIcons({ lucideLogOut })],
  template: `
    <button
      hlmBtn
      [variant]="variant()"
      type="button"
      (click)="handleSignOut()"
      class="rounded-full gap-1.5 px-2.5 sm:px-3 h-9 text-xs sm:text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer {{ buttonClass() }}"
      [attr.aria-label]="label()"
    >
      <ng-icon name="lucideLogOut" [size]="iconSize()" />
      <span [class.hidden]="!showTextOnMobile()" [class.sm:inline]="!showTextOnMobile()">
        {{ label() }}
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignOutButton {
  private readonly authService = inject(AuthService);
  private readonly localeService = inject(LocaleService);

  readonly text = input<string>();
  readonly showTextOnMobile = input<boolean>(false);
  readonly buttonClass = input<string>('');
  readonly iconSize = input<string>('15');
  readonly variant = input<'ghost' | 'outline' | 'default'>('ghost');

  readonly signedOut = output<void>();

  readonly label = computed(
    () => this.text() || this.localeService.translate('nav_sign_out'),
  );

  handleSignOut(): void {
    this.signedOut.emit();
    this.authService.logout();
  }
}
