import { TranslatePipe } from '@invento/core';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/core';
import { AuthService } from '../../../core/service/auth.service';
import { GoogleAuthService } from '../../../core/service/google-auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '@invento/shared-util-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink, HlmInput, HlmButton],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private googleAuthService = inject(GoogleAuthService);
  private router = inject(Router);
  private readonly _localeService = inject(LocaleService);

  googleBtnContainer = viewChild<ElementRef<HTMLDivElement>>('googleBtnContainer');

  isLoading = signal(false);
  isGoogleLoading = signal(false);

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
    const passwordControl = this.registerForm.get('password');
    const confirmControl = this.registerForm.get('confirmPassword');

    if (passwordControl && confirmControl) {
      if (passwordControl.invalid) {
        confirmControl.disable();
      }

      passwordControl.statusChanges.subscribe(() => {
        if (passwordControl.valid) {
          confirmControl.enable();
        } else {
          confirmControl.disable();
        }
      });
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

  passwordMatchValidator(g: AbstractControl) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      toast.error(this._localeService.translate('auth_register_errors'));
      this.registerForm.markAllAsTouched();
      return;
    }

    const registerPayload = this.registerForm.getRawValue();

    this.isLoading.set(true);
    this.authService.register(registerPayload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || this._localeService.translate('auth_register_success'));
        // Redirect to verify email, passing the email as state
        this.router.navigate(['/auth/verify-email'], {
          queryParams: { email: registerPayload.email },
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = extractErrorMessage(err, 'Registration failed.');
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
