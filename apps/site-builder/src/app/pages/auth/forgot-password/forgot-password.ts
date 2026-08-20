import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/core';
import { AuthService } from '../../../core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HlmInput, HlmLabel, HlmButton],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private readonly _localeService = inject(LocaleService);
  private router = inject(Router);

  isLoading = signal(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      toast.error(this._localeService.translate('auth_forgot_empty'));
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordForm.value.email!;

    this.isLoading.set(true);
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || this._localeService.translate('auth_forgot_success'));
        // Redirect to reset password, passing email
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { email },
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Failed to send reset code.');
        toast.error(errorMsg);
      },
    });
  }
}
