import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@invento/user-site/environments/environment';
import { TokenService } from './token.service';
import {
  AuthResponse,
  MessageResponse,
  RefreshTokenResponse,
  RegisterResponse,
  User,
} from '@invento/user-site/app/core/interface/auth.interface';

const USER_STORAGE_KEY = 'usersite_current_user';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  private apiUrl = environment.apiUrl;

  // State for the current user
  currentUser = signal<User | null>(this.loadStoredUser());

  /**
   * Reactive form of `isAuthenticated()`.
   *
   * The navbar is OnPush in a zoneless app, so a plain method call is only re-evaluated when
   * something else happens to mark that view dirty — signing in or out left the account menu
   * showing the previous state. `setCurrentUser` is the single funnel for both, so deriving
   * from it keeps the menu honest.
   */
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  private loadStoredUser(): User | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch {
      // ignore JSON parse error
    }

    // Fallback: parse from JWT access token if available
    try {
      const token = this.tokenService.getAccessToken();
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          const fullName = (payload['name'] || payload['fullName'] || '') as string;
          let firstName = (payload['firstName'] ||
            payload['first_name'] ||
            payload['given_name'] ||
            '') as string;
          let lastName = (payload['lastName'] ||
            payload['last_name'] ||
            payload['family_name'] ||
            '') as string;

          if (!firstName && !lastName && fullName) {
            const parts = fullName.trim().split(' ');
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
          }

          const email = (payload['email'] ||
            payload['user_email'] ||
            payload['sub'] ||
            '') as string;

          if (email || firstName || lastName) {
            return {
              id: (payload['id'] || payload['sub'] || payload['userId'] || '') as string,
              firstName,
              lastName,
              image: (payload['image'] || null) as string | null,
              email,
              role: (payload['role'] || 'customer') as string,
              isEmailVerified: Boolean(payload['isEmailVerified']),
              createdAt: (payload['createdAt'] || new Date().toISOString()) as string,
              updatedAt: (payload['updatedAt'] || new Date().toISOString()) as string,
            };
          }
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  register(data: unknown): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/users/register`, data);
  }

  login(credentials: unknown): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/login/`, credentials).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this.setCurrentUser(response.user);
      }),
    );
  }

  setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }

  verifyEmail(email: string, otp: string, storeSlug: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/verify-email/`, {
      email,
      otp,
      storeSlug,
    });
  }

  resendVerification(email: string, storeSlug: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/users/resend-verification/`, { email, storeSlug });
  }

  forgotPassword(email: string, storeSlug: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/forgot-password/`, {
      email,
      storeSlug,
    });
  }

  resetPassword(data: unknown): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/reset-password/`, data);
  }

  changePassword(data: unknown): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.apiUrl}/users/change-password`, data);
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}/users/refresh-token`, { refreshToken })
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
        }),
      );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.setCurrentUser(null);
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
