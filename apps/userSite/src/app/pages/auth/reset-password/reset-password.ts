import { TranslatePipe } from '@invento/shared-util-i18n';
import { Component, inject, signal, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, HlmInput, HlmLabel, HlmButton],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  userEmail = '';
  storeSlug = '';

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

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  ngOnInit() {
    this.storeSlug =
      this.route.snapshot.paramMap.get('storeSlug') ??
      this.route.parent?.snapshot.paramMap.get('storeSlug') ??
      this.resolvedStoreSlug();

    // Cache returnUrl if present
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ||
      this.route.snapshot.queryParamMap.get('redirectUrl');
    if (returnUrl && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('invento_auth_return_url', returnUrl);
    }

    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.userEmail = emailFromQuery;
    } else {
      const nav = history.state;
      if (nav?.email) {
        this.userEmail = nav.email;
      }
    }

    const newPasswordControl = this.passwordForm.get('newPassword');
    const confirmControl = this.passwordForm.get('confirmPassword');

    if (newPasswordControl && confirmControl) {
      confirmControl.disable();

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

    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();

    this.isLoading.set(true);
    this.authService
      .resetPassword({
        email: this.userEmail,
        otp: this.verifiedOtp,
        newPassword: newPassword || '',
        confirmPassword: confirmPassword || '',
        storeSlug: this.storeSlug,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          toast.success(res.message || 'Password reset successfully.');

          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ||
            this.route.snapshot.queryParamMap.get('redirectUrl') ||
            (typeof sessionStorage !== 'undefined'
              ? sessionStorage.getItem('invento_auth_return_url')
              : null);

          this.router.navigate(['../login'], {
            relativeTo: this.route,
            queryParams: {
              email: this.userEmail,
              ...(returnUrl ? { returnUrl } : {}),
            },
          });
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
