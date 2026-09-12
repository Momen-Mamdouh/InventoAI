import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
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
  lucideUser,
  lucideMail,
  lucideShield,
  lucideCalendar,
  lucideCheckCircle2,
  lucideAlertCircle,
  lucideCopy,
  lucideCheck,
  lucideCircle,
  lucideLoader2,
  lucideInfo,
  lucidePackage,
  lucideHelpCircle,
  lucideArrowRight,
  lucideLock,
  lucideKeyRound,
  lucideEye,
  lucideEyeOff,
} from '@ng-icons/lucide';
import { toast } from '@spartan/helm/sonner';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { AuthService } from '@invento/shared-data-access-auth';
import { extractErrorMessage } from '@invento/shared-util-error';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!newPassword || !confirmPassword) return null;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-account-settings-profile',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmDialogImports,
    BrnDialogContent,
    HlmTypographyImports,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideUser,
      lucideMail,
      lucideShield,
      lucideCalendar,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideCopy,
      lucideCheck,
      lucideCircle,
      lucideLoader2,
      lucideInfo,
      lucidePackage,
      lucideHelpCircle,
      lucideArrowRight,
      lucideLock,
      lucideKeyRound,
      lucideEye,
      lucideEyeOff,
    }),
  ],
  templateUrl: './account-settings-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsProfile {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly storeSlug = inject(StoreSlugService).slug;

  readonly currentUser = this.authService.currentUser;
  readonly copiedField = signal<string | null>(null);
  readonly isResending = signal(false);

  // Direct Change Password Modal State
  readonly isPasswordModalOpen = signal(false);
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly isPasswordLoading = signal(false);
  readonly newPasswordVal = signal('');
  readonly confirmPasswordVal = signal('');

  readonly passwordForm = this.fb.nonNullable.group(
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

  readonly initials = computed<string>(() => {
    const user = this.currentUser();
    if (!user) return '';
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return `${f}${l}`.toUpperCase() || 'U';
  });

  readonly formattedMemberSince = computed<string>(() => {
    const user = this.currentUser();
    if (!user?.createdAt) return '';
    try {
      const date = new Date(user.createdAt);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(this.locale.locale(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  });

  constructor() {
    this.passwordForm.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.newPasswordVal.set(val ?? '');
      });

    this.passwordForm.controls.confirmPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.confirmPasswordVal.set(val ?? '');
      });
  }

  openPasswordModal(): void {
    this.passwordForm.reset();
    this.showCurrent.set(false);
    this.showNew.set(false);
    this.showConfirm.set(false);
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
    this.passwordForm.reset();
  }

  onPasswordModalState(event: 'closed' | 'open'): void {
    if (event === 'closed') {
      this.isPasswordModalOpen.set(false);
      this.passwordForm.reset();
    }
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.getRawValue();

    this.isPasswordLoading.set(true);
    this.authService
      .changePassword({ oldPassword: currentPassword, newPassword, confirmPassword })
      .subscribe({
        next: () => {
          this.isPasswordLoading.set(false);
          toast.success(this.locale.translate('account_settings.security.toast_success'));
          this.closePasswordModal();
        },
        error: (err) => {
          this.isPasswordLoading.set(false);
          toast.error(
            extractErrorMessage(
              err,
              this.locale.translate('account_settings.security.toast_error'),
            ),
          );
        },
      });
  }

  copyToClipboard(text: string, field: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        this.copiedField.set(field);
        toast.success(this.locale.translate('account_settings.profile.copied'));
        setTimeout(() => {
          if (this.copiedField() === field) {
            this.copiedField.set(null);
          }
        }, 2000);
      },
      () => {
        // Fallback if clipboard API is restricted
      },
    );
  }

  resendVerification(): void {
    const user = this.currentUser();
    if (!user?.email || user.isEmailVerified || this.isResending()) return;

    this.isResending.set(true);
    const slug = this.storeSlug();
    this.authService
      .resendVerification(user.email, slug ? { storeSlug: slug } : undefined)
      .subscribe({
        next: () => {
          this.isResending.set(false);
          toast.success(this.locale.translate('account_settings.profile.code_sent'));
        },
        error: (err) => {
          this.isResending.set(false);
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

