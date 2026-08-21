import { TranslatePipe } from '@invento/core';
import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/core';
import { AuthService } from '../../../core/service/auth.service';
import { GoogleAuthService } from '../../../core/service/google-auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmButton],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);
  private readonly _localeService = inject(LocaleService);

  googleBtnContainer = viewChild<ElementRef<HTMLDivElement>>('googleBtnContainer');

  isLoading = signal(false);
  isGoogleLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async ngAfterViewInit() {
    await this.initGoogleAuth();
  }

  private async initGoogleAuth() {
    const initialized = await this.googleAuthService.initialize((idToken) => {
      this.handleGoogleSignIn(idToken);
    });

    if (initialized) {
      const container = this.googleBtnContainer();
      if (container?.nativeElement) {
        this.googleAuthService.renderButton(container.nativeElement, {
          width: Math.min(Math.max(container.nativeElement.offsetWidth || 350, 200), 400),
        });
      }
    }
  }

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

  loginWithGoogle() {
    if (!this.googleAuthService.hasClientId()) {
      toast.error(
        'Google Client ID is not configured. Please add your Google Client ID to environment.ts or .env',
      );
      return;
    }

    this.googleAuthService.prompt();
  }

  handleGoogleSignIn(idToken: string) {
    this.isGoogleLoading.set(true);
    this.authService.googleLoginOwner(idToken).subscribe({
      next: () => {
        this.isGoogleLoading.set(false);
        toast.success('Signed in with Google successfully');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isGoogleLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Google sign-in failed. Please try again.');
        toast.error(errorMsg);
      },
    });
  }
}
