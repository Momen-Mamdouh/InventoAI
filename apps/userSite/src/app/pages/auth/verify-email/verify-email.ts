import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '../../../core/service/auth.service';

import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '../../../core/utils/error.utils';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, HlmLabel, HlmButton],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  isResending = signal(false);
  userEmail = '';
  storeSlug = '';

  verifyForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6)]],
  });

  otpValues = ['', '', '', '', '', ''];

  ngOnInit() {
    // Extract storeSlug from route params (parent route)
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

    // Read email from query params
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.userEmail = emailFromQuery;
      return;
    }

    const nav = history.state;
    if (nav?.email) {
      this.userEmail = nav.email;
      return;
    }

    const currentUser = this.authService.currentUser();
    if (currentUser?.email && !currentUser.isEmailVerified) {
      this.userEmail = currentUser.email;
    }
  }

  onOtpInput(index: number, event: Event, nextId?: string) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    this.otpValues[index] = value;
    this.verifyForm.get('otp')?.setValue(this.otpValues.join(''));

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

  onSubmit() {
    if (this.verifyForm.invalid) {
      toast.error('Please enter the verification code.');
      this.verifyForm.markAllAsTouched();
      return;
    }

    const { otp } = this.verifyForm.value;

    this.isLoading.set(true);
    this.authService.verifyEmail(this.userEmail, otp!, this.storeSlug).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Email verified successfully.');

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
        const errorMsg = extractErrorMessage(err, 'Verification failed.');
        toast.error(errorMsg);
      },
    });
  }

  resendCode() {
    if (!this.userEmail) return;

    this.isResending.set(true);
    this.authService.resendVerification(this.userEmail, this.storeSlug).subscribe({
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
