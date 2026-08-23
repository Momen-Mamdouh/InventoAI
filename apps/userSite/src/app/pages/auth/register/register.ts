import { TranslatePipe } from '@invento/core';
import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
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
  selector: 'app-register',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmLabel, HlmButton],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit, AfterViewInit {
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

  registerForm = this.fb.group(
    {
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[a-zA-Z\u00C0-\u00FF\u0600-\u06FF\s'-]+$/),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[a-zA-Z\u00C0-\u00FF\u0600-\u06FF\s'-]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
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

  ngOnInit() {
    // Extract storeSlug from URL
    const slug =
      this.route.snapshot.paramMap.get('storeSlug') ??
      this.route.parent?.snapshot.paramMap.get('storeSlug') ??
      this.resolvedStoreSlug();
    this.storeSlug = slug;

    // Cache returnUrl if present
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ||
      this.route.snapshot.queryParamMap.get('redirectUrl');
    if (returnUrl && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('invento_auth_return_url', returnUrl);
    }

    const passwordControl = this.registerForm.get('password');
    const confirmControl = this.registerForm.get('confirmPassword');

    if (passwordControl && confirmControl) {
      confirmControl.disable();
      passwordControl.statusChanges.subscribe(() => {
        if (passwordControl.valid) {
          confirmControl.enable();
        } else {
          confirmControl.disable();
        }
      });
    }
  }

  ngAfterViewInit() {
    // Initialize Google Auth and render the hidden button — clicking it programmatically
    // opens the real Google account-picker popup.
    if (this.googleAuthService.hasClientId()) {
      this.googleAuthService
        .initialize((idToken) => this.handleGoogleLogin(idToken))
        .then((ok) => {
          if (ok && this.googleBtnContainer?.nativeElement) {
            this.googleAuthService.renderButton(this.googleBtnContainer.nativeElement, {
              width: 1, // minimal — it's hidden; only the click matters
              text: 'signup_with',
            });
          }
        })
        .catch((err) => console.warn('Google Auth init error:', err));
    }
  }

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  /** Clicks the hidden native Google button — opens the real account picker popup. */
  signUpWithGoogle(): void {
    if (this.isGoogleLoading()) return;

    const container = this.googleBtnContainer?.nativeElement;
    if (container) {
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
      toast.error('Store not found. Cannot sign up with Google.');
      return;
    }

    this.isGoogleLoading.set(true);
    // POST /users/google handles both sign-up and sign-in in one call
    this.authService.googleLogin(idToken, this.storeSlug).subscribe({
      next: () => {
        this.isGoogleLoading.set(false);
        toast.success('Account created and signed in with Google');
        this.navigateAfterLogin();
      },
      error: (err) => {
        this.isGoogleLoading.set(false);
        const msg = extractErrorMessage(err, 'Google sign-up failed. Please try again.');
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
    if (this.registerForm.invalid) {
      toast.error('Please fill all required fields correctly.');
      this.registerForm.markAllAsTouched();
      return;
    }

    const formVal = this.registerForm.getRawValue();
    const registerPayload = {
      ...formVal,
      storeSlug: this.storeSlug,
    };

    this.isLoading.set(true);
    this.authService.register(registerPayload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Registration successful. Please verify your email.');

        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') ||
          this.route.snapshot.queryParamMap.get('redirectUrl') ||
          (typeof sessionStorage !== 'undefined'
            ? sessionStorage.getItem('invento_auth_return_url')
            : null);

        this.router.navigate(['../verify-email'], {
          relativeTo: this.route,
          queryParams: {
            email: registerPayload.email,
            ...(returnUrl ? { returnUrl } : {}),
          },
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Registration failed.');
        toast.error(errorMsg);
      },
    });
  }
}
