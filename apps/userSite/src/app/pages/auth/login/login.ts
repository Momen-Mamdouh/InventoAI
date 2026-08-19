import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/user-site/app/core/utils/error.utils';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HlmInput, HlmLabel, HlmButton],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
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
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Login failed. Please check your credentials.');
        toast.error(errorMsg);
      },
    });
  }
}
