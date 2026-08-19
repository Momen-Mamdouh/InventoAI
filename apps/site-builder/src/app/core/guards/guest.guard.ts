import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@/app/core/service/auth.service';

/**
 * Protects the auth routes (login, register, ...) from an already signed-in user —
 * bounces them back to the builder flow instead.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/build/brainstorm');
};
