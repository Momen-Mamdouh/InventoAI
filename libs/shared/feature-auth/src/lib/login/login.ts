import { TranslatePipe } from '@invento/shared-util-i18n';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { toast } from '@spartan/helm/sonner';
import { AUTH_CONFIG, AuthService, GoogleAuthService } from '@invento/shared-data-access-auth';

import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';

/**
 * One `Login` for all three apps (SC-005). Ported from invento/site-builder's byte-identical
 * `login.ts`/`login.html` (userSite's variant differs substantially — deferred to Phase 9, see
 * `auth-superset.md`). The invento-only "send owners with no store yet to `/no-store`" rule is
 * expressed through `AUTH_CONFIG.resolvePostAuthRoute`, not a branch here.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmButton],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly config = inject(AUTH_CONFIG);

  /** Where to send the user after a successful login. Falls back to `postLoginRoute`. */
  private readonly returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') || this.config.postLoginRoute;

  googleBtnContainer = viewChild<ElementRef<HTMLDivElement>>('googleBtnContainer');

  isLoading = signal(false);
  isGoogleLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.has('forceLogout')) {
      this.authService.setCurrentUser(null);
    }
  }

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

  private resolveTarget(): string {
    return this.config.resolvePostAuthRoute
      ? this.config.resolvePostAuthRoute(this.authService, this.returnUrl)
      : this.returnUrl;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      toast.error('Please enter valid email and password.');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        toast.success('Logged in successfully');
        this.router.navigateByUrl(this.resolveTarget());
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
        this.router.navigateByUrl(this.resolveTarget());
      },
      error: (err) => {
        this.isGoogleLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Google sign-in failed. Please try again.');
        toast.error(errorMsg);
      },
    });
  }
}
