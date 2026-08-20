import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/core';
import { AuthService } from '../../../core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HlmInput, HlmButton],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly _localeService = inject(LocaleService);

  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      toast.error(this._localeService.translate('auth_login_empty'));
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        toast.success(this._localeService.translate('auth_login_success'));
        this.router.navigate(['/']); // Redirect to home or dashboard
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Login failed. Please check your credentials.');
        toast.error(errorMsg);
      },
    });
  }

  // Placeholder for Google Login
  loginWithGoogle() {
    toast.info(this._localeService.translate('auth_google_soon'));
  }
}
