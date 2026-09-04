import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff, lucideLock } from '@ng-icons/lucide';
import { toast } from '@spartan/helm/sonner';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { AuthService } from '@invento/shared-data-access-auth';
import { extractErrorMessage } from '@invento/shared-util-error';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!newPassword || !confirmPassword) return null;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-account-settings-security',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmCardImports,
    HlmTypographyImports,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideEye, lucideEyeOff, lucideLock })],
  templateUrl: './account-settings-security.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsSecurity {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly locale = inject(LocaleService);

  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly isLoading = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      // Mirrors the backend's ChangePasswordDto: MinLength(8) plus PASSWORD_PATTERN
      // (at least one letter and one digit). Without the pattern here the server rejects the
      // submission and the shopper only learns why after a round trip.
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator() },
  );

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();

    this.isLoading.set(true);
    this.authService
      .changePassword({ oldPassword: currentPassword, newPassword, confirmPassword })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          toast.success(this.locale.translate('account_settings.security.toast_success'));
          this.form.reset();
        },
        error: (err) => {
          this.isLoading.set(false);
          toast.error(
            extractErrorMessage(
              err,
              this.locale.translate('account_settings.security.toast_error'),
            ),
          );
        },
      });
  }
}
