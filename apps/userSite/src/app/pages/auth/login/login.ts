import { TranslatePipe } from '@invento/shared-util-i18n';
import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';
import { GoogleAuthService } from '@invento/user-site/app/core/service/google-auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmLabel, HlmButton],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, AfterViewInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('googleBtnContainer', { static: false }) googleBtnContainer!: ElementRef<HTMLElement>;

  isLoading = signal(false);
  isGoogleLoading = signal(false);
  storeSlug = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit() {
    this.storeSlug =
      this.route.snapshot.paramMap.get('storeSlug') ??
      this.route.parent?.snapshot.paramMap.get('storeSlug') ??
      this.resolvedStoreSlug();

    // Prefill email if provided in query params
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.loginForm.patchValue({ email: emailParam });
    }

    // Cache returnUrl if present
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ||
      this.route.snapshot.queryParamMap.get('redirectUrl');
    if (returnUrl && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('invento_auth_return_url', returnUrl);
    }
  }

  ngAfterViewInit() {
    // Initialize Google Auth and render the hidden button — clicking it programmatically
    // opens the real Google account-picker popup, which is far more reliable than prompt().
    if (this.googleAuthService.hasClientId()) {
      this.googleAuthService
        .initialize((idToken) => this.handleGoogleLogin(idToken))
        .then((ok) => {
          if (ok && this.googleBtnContainer?.nativeElement) {
            this.googleAuthService.renderButton(this.googleBtnContainer.nativeElement, {
              width: 1, // minimal — it's hidden; only the click matters
            });
          }
        })
        .catch((err) => console.warn('Google Auth init error:', err));
    }
  }

  /** Clicks the hidden native Google button — opens the real account picker popup. */
  loginWithGoogle(): void {
    if (this.isGoogleLoading()) return;

    const container = this.googleBtnContainer?.nativeElement;
    if (container) {
      // The native Google button is inside an iframe; click the div itself triggers it
      const btn = container.querySelector('div[role="button"]') as HTMLElement | null;
      if (btn) {
        btn.click();
        return;
      }
    }

    // Fallback: One Tap prompt
    this.googleAuthService.prompt();
  }

  private handleGoogleLogin(idToken: string): void {
    if (!this.storeSlug) {
      toast.error('Store not found. Cannot sign in with Google.');
      return;
    }

    this.isGoogleLoading.set(true);
    this.authService.googleLogin(idToken, this.storeSlug).subscribe({
      next: () => {
        this.isGoogleLoading.set(false);
        toast.success('Signed in with Google');
        this.navigateAfterLogin();
      },
      error: (err) => {
        this.isGoogleLoading.set(false);
        const msg = extractErrorMessage(err, 'Google sign-in failed. Please try again.');
        toast.error(msg);
      },
    });
  }

  private navigateAfterLogin(): void {
    let returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ||
      this.route.snapshot.queryParamMap.get('redirectUrl');

    if (!returnUrl && typeof sessionStorage !== 'undefined') {
      returnUrl = sessionStorage.getItem('invento_auth_return_url');
    }

    if (returnUrl) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('invento_auth_return_url');
      }
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/', this.storeSlug]);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      toast.error('Please enter valid email and password.');
      this.loginForm.markAllAsTouched();
      return;
    }

    const loginPayload = {
      ...this.loginForm.value,
      storeSlug: this.storeSlug,
    };

    this.isLoading.set(true);
    this.authService.login(loginPayload).subscribe({
      next: () => {
        this.isLoading.set(false);
        toast.success('Logged in successfully');
        this.navigateAfterLogin();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Login failed. Please check your credentials.');
        toast.error(errorMsg);
      },
    });
  }
}
