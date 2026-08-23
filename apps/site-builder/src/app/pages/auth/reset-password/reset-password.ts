import { TranslatePipe } from '@invento/core';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/core';
import { AuthService } from '../../../core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, HlmInput, HlmLabel, HlmButton],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private readonly _localeService = inject(LocaleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  userEmail = '';

  // Two-step flow: 'otp' -> 'password'
  currentStep = signal<'otp' | 'password'>('otp');
  verifiedOtp = '';

  // Step 1: OTP form
  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Step 2: Password form
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
    // Read from query params first
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.userEmail = emailFromQuery;
    } else {
      // `history` does not exist on the server; reading it bare crashed the
      // prerender of this route with "ReferenceError: history is not defined".
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

  // Step 1: Verify OTP (just UI progression, no separate API call)
  verifyOtp() {
    if (this.otpForm.invalid) {
      toast.error(this._localeService.translate('auth_reset_code_empty'));
      this.otpForm.markAllAsTouched();
      return;
    }

    this.verifiedOtp = this.otpForm.value.otp!;
    this.currentStep.set('password');
    toast.success(this._localeService.translate('auth_reset_code_accepted'));
  }

  // Step 2: Submit new password with OTP to the API
  onSubmit() {
    if (this.passwordForm.invalid) {
      toast.error(this._localeService.translate('auth_form_errors'));
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;

    this.isLoading.set(true);
    this.authService
      .resetPassword({
        email: this.userEmail,
        otp: this.verifiedOtp,
        newPassword,
        confirmPassword,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          toast.success(res.message || this._localeService.translate('auth_reset_success'));
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = extractErrorMessage(err, 'Failed to reset password.');
          toast.error(errorMsg);
          // If OTP was invalid, go back to step 1
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
