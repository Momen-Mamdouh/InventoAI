import { TranslatePipe } from '@invento/shared-util-i18n';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toast } from '@spartan/helm/sonner';
import { AUTH_CONFIG, AuthService, resolveAuthBasePath } from '@invento/shared-data-access-auth';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';

import { extractErrorMessage } from '@invento/shared-util-error';

/** One `ForgotPassword` for all three apps (SC-005). Ported from invento/site-builder's shared template. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmLabel, HlmButton, HlmH1, HlmMuted],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly config = inject(AUTH_CONFIG);

  /** Resolved once per page load — see `AuthConfig.authBasePath`'s doc comment. */
  protected readonly authBasePath = resolveAuthBasePath(this.config);

  isLoading = signal(false);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      toast.error('Please enter a valid email address.');
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordForm.value.email!;
    const slug = this.config.resolveStoreSlug?.();

    this.isLoading.set(true);
    this.authService.forgotPassword(email, slug ? { storeSlug: slug } : undefined).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Reset code sent to your email.');
        this.router.navigate([`${this.authBasePath}/reset-password`], {
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
