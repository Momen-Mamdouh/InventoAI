import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEye,
  lucideEyeOff,
  lucideLock,
  lucideCheck,
  lucideCircle,
  lucideShieldCheck,
  lucideLoader2,
  lucideKeyRound,
} from '@ng-icons/lucide';
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
  standalone: true,
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
  providers: [
    provideIcons({
      lucideEye,
      lucideEyeOff,
      lucideLock,
      lucideCheck,
      lucideCircle,
      lucideShieldCheck,
      lucideLoader2,
      lucideKeyRound,
    }),
  ],
  templateUrl: './account-settings-security.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsSecurity {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly isLoading = signal(false);

  readonly isGoogleAccount = signal(false);
  readonly newPasswordVal = signal('');
  readonly confirmPasswordVal = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
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

  readonly hasMinLength = computed<boolean>(() => this.newPasswordVal().length >= 8);
  readonly hasLetterAndNumber = computed<boolean>(() =>
    /^(?=.*[A-Za-z])(?=.*\d)/.test(this.newPasswordVal()),
  );
  readonly passwordsMatch = computed<boolean>(() => {
    const np = this.newPasswordVal();
    const cp = this.confirmPasswordVal();
    return np.length > 0 && np === cp;
  });

  constructor() {
    const user = this.currentUser();
    if (
      user?.image &&
      (user.image.includes('googleusercontent.com') || user.image.includes('google'))
    ) {
      this.isGoogleAccount.set(true);
    }

    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.newPasswordVal.set(val ?? '');
      });

    this.form.controls.confirmPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.confirmPasswordVal.set(val ?? '');
      });
  }

  save(): void {
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
          const errorMsg = extractErrorMessage(err, '');
          if (
            errorMsg.includes('Google') ||
            errorMsg.includes('Account was created using Google') ||
            errorMsg.includes('NO_PASSWORD_SET')
          ) {
            this.isGoogleAccount.set(true);
            return;
          }
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

