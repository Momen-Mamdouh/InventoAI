import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '../../../core/service/auth.service';

import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, HlmLabel, HlmButton],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  isResending = signal(false);
  userEmail = '';

  verifyForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6)]],
  });

  otpValues = ['', '', '', '', '', ''];

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

  ngOnInit() {
    // Read from query params first
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.userEmail = emailFromQuery;
      return;
    }

    // Fallback: check if user navigated with router state. `history` does not
    // exist on the server; reading it bare crashed this route's prerender with
    // "ReferenceError: history is not defined".
    const nav = typeof history === 'undefined' ? null : history.state;
    if (nav?.email) {
      this.userEmail = nav.email;
      return;
    }

    // Fallback: check current user from AuthService
    const currentUser = this.authService.currentUser();
    if (currentUser?.email && !currentUser.isEmailVerified) {
      this.userEmail = currentUser.email;
    }
    // If still no email, page stays visible but submit will show an error
  }

  onSubmit() {
    if (this.verifyForm.invalid) {
      toast.error('Please enter the verification code.');
      this.verifyForm.markAllAsTouched();
      return;
    }

    const { otp } = this.verifyForm.value;

    this.isLoading.set(true);
    this.authService.verifyEmail(this.userEmail, otp!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Email verified successfully.');
        this.router.navigate(['/auth/login']);
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
    this.authService.resendVerification(this.userEmail).subscribe({
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
