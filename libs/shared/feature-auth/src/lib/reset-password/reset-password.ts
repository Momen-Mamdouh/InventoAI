import { TranslatePipe } from '@invento/shared-util-i18n';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AUTH_CONFIG, AuthService, resolveAuthBasePath } from '@invento/shared-data-access-auth';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';

/** One `ResetPassword` for all three apps (SC-005). Ported from invento/site-builder's shared template. */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ReactiveFormsModule, HlmInput, HlmLabel, HlmButton],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly config = inject(AUTH_CONFIG);

  /** Resolved once per page load — see `AuthConfig.authBasePath`'s doc comment. */
  private readonly authBasePath = resolveAuthBasePath(this.config);

  isLoading = signal(false);
  userEmail = '';

  currentStep = signal<'otp' | 'password'>('otp');
  verifiedOtp = '';

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6)]],
  });

  passwordForm = this.fb.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
          ),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  otpValues = ['', '', '', '', '', ''];

  onOtpInput(index: number, event: Event, nextId?: string) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    this.otpValues[index] = value;
    this.otpForm.get('otp')?.setValue(this.otpValues.join(''));

    if (value && nextId) {
      document.getElementById(nextId)?.focus();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, prevId?: string) {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (!input.value && prevId) {
        document.getElementById(prevId)?.focus();
      }
    }
  }

  passwordMatchValidator(g: AbstractControl) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  ngOnInit() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.userEmail = emailFromQuery;
    } else {
      const nav = typeof history === 'undefined' ? null : history.state;
      if (nav?.email) {
        this.userEmail = nav.email;
      }
    }

    const newPasswordControl = this.passwordForm.get('newPassword');
    const confirmControl = this.passwordForm.get('confirmPassword');

    if (newPasswordControl && confirmControl) {
      if (newPasswordControl.invalid) {
        confirmControl.disable();
      }

      newPasswordControl.statusChanges.subscribe(() => {
        if (newPasswordControl.valid) {
          confirmControl.enable();
        } else {
          confirmControl.disable();
        }
      });
    }
  }

  verifyOtp() {
    if (this.otpForm.invalid) {
      toast.error('Please enter the 6-digit verification code.');
      this.otpForm.markAllAsTouched();
      return;
    }

    this.verifiedOtp = this.otpForm.value.otp!;
    this.currentStep.set('password');
    toast.success('Code accepted. Now set your new password.');
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      toast.error('Please fix the errors before submitting.');
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;
    const slug = this.config.resolveStoreSlug?.();

    this.isLoading.set(true);
    this.authService
      .resetPassword({
        email: this.userEmail,
        otp: this.verifiedOtp,
        newPassword,
        confirmPassword,
        ...(slug ? { storeSlug: slug } : {}),
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          toast.success(res.message || 'Password reset successfully.');
          this.router.navigate([`${this.authBasePath}/login`]);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = extractErrorMessage(err, 'Failed to reset password.');
          toast.error(errorMsg);
          if (
            err.status === 400 ||
            errorMsg.toLowerCase().includes('otp') ||
            errorMsg.toLowerCase().includes('code')
          ) {
            this.currentStep.set('otp');
            this.verifiedOtp = '';
          }
        },
      });
  }
}
