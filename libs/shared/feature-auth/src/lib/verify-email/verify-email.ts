import { TranslatePipe } from '@invento/shared-util-i18n';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import {
  AUTH_CONFIG,
  AuthService,
  resolveVerifyEmailRedirect,
} from '@invento/shared-data-access-auth';

import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { HlmInputOtpImports } from '@spartan/helm/input-otp';

import { extractErrorMessage } from '@invento/shared-util-error';

/** One `VerifyEmail` for all three apps (SC-005). Ported from invento/site-builder's shared template. */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    HlmLabel,
    HlmButton,
    HlmH1,
    HlmMuted,
    BrnInputOtp,
    ...HlmInputOtpImports,
  ],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly config = inject(AUTH_CONFIG);

  isLoading = signal(false);
  isResending = signal(false);
  userEmail = '';

  verifyForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.userEmail = emailFromQuery;
      return;
    }

    // `history` does not exist on the server; reading it bare crashes SSR prerendering.
    const nav = typeof history === 'undefined' ? null : history.state;
    if (nav?.email) {
      this.userEmail = nav.email;
      return;
    }

    const currentUser = this.authService.currentUser();
    if (currentUser?.email && !currentUser.isEmailVerified) {
      this.userEmail = currentUser.email;
    }
  }

  onSubmit() {
    if (this.verifyForm.invalid) {
      toast.error('Please enter the verification code.');
      this.verifyForm.markAllAsTouched();
      return;
    }

    const { otp } = this.verifyForm.value;
    const slug = this.config.resolveStoreSlug?.();

    this.isLoading.set(true);
    this.authService
      .verifyEmail(this.userEmail, otp!, slug ? { storeSlug: slug } : undefined)
      .subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Email verified successfully.');
        this.router.navigateByUrl(resolveVerifyEmailRedirect(this.config));
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Verification failed.');
        toast.error(errorMsg);
      },
    });
  }

  resendCode() {
    if (!this.userEmail) return;

    const slug = this.config.resolveStoreSlug?.();

    this.isResending.set(true);
    this.authService
      .resendVerification(this.userEmail, slug ? { storeSlug: slug } : undefined)
      .subscribe({
      next: () => {
        this.isResending.set(false);
        toast.success('Verification code resent.');
      },
      error: (err) => {
        this.isResending.set(false);
        const errorMsg = extractErrorMessage(err, 'Failed to resend code.');
        toast.error(errorMsg);
      },
    });
  }
}
