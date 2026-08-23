import { TranslatePipe } from '@invento/core';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmLabel, HlmButton],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  storeSlug = '';

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit() {
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
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      toast.error('Please enter a valid email address.');
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotPasswordForm.value.email!;

    this.isLoading.set(true);
    this.authService.forgotPassword(email, this.storeSlug).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Reset code sent to your email.');

        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') ||
          this.route.snapshot.queryParamMap.get('redirectUrl') ||
          (typeof sessionStorage !== 'undefined'
            ? sessionStorage.getItem('invento_auth_return_url')
            : null);

        this.router.navigate(['../reset-password'], {
          relativeTo: this.route,
          queryParams: {
            email,
            ...(returnUrl ? { returnUrl } : {}),
          },
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
