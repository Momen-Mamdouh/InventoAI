import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '../../../core/service/auth.service';

import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';

import { extractErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HlmInput, HlmButton],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);

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

  passwordMatchValidator(g: AbstractControl) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      toast.error('Please fill all required fields correctly.');
      this.registerForm.markAllAsTouched();
      return;
    }

    const registerPayload = this.registerForm.getRawValue();

    this.isLoading.set(true);
    this.authService.register(registerPayload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        toast.success(res.message || 'Registration successful. Please verify your email.');
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
}
