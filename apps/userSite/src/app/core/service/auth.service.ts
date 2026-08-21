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
  /**
   * Reactive form of `isAuthenticated()`.
   *
   * The navbar is OnPush in a zoneless app, so a plain method call is only re-evaluated when
   * something else happens to mark that view dirty — signing in or out left the account menu
   * showing the previous state. `setCurrentUser` is the single funnel for both, so deriving
   * from it keeps the menu honest.
   */
  readonly isLoggedIn = computed(() => this.currentUser() !== null && this.tokenService.hasToken());

  private loadStoredUser(): User | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    const token = this.tokenService.getAccessToken();
    if (!token) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    // Verify token is not expired (exp is in seconds)
    if (typeof payload['exp'] === 'number' && payload['exp'] * 1000 < Date.now()) {
      localStorage.removeItem(USER_STORAGE_KEY);
      this.tokenService.clearTokens();
      return null;
    }

    // Role check: an owner token belongs to the invento app, not customer storefront
    const role = (payload['role'] || '') as string;
    if (role === 'owner') {
      localStorage.removeItem(USER_STORAGE_KEY);
      this.tokenService.clearTokens();
      return null;
    }

    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed && parsed.role !== 'owner') {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }

    // Fallback: parse from JWT access token if available
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

    const email = (payload['email'] || payload['user_email'] || payload['sub'] || '') as string;

    if (email || firstName || lastName) {
      return {
        id: (payload['id'] || payload['sub'] || payload['userId'] || '') as string,
        firstName,
        lastName,
        image: (payload['image'] || null) as string | null,
        email,
        role: role || 'customer',
        isEmailVerified: Boolean(payload['isEmailVerified']),
        createdAt: (payload['createdAt'] || new Date().toISOString()) as string,
        updatedAt: (payload['updatedAt'] || new Date().toISOString()) as string,
      };
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

  googleLogin(idToken: string, storeSlug: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/google`, { idToken, storeSlug }).pipe(
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
    const token = this.tokenService.getAccessToken();
    if (!token) return false;

    const payload = decodeJwtPayload(token);
    if (!payload) return false;

    if (typeof payload['exp'] === 'number' && payload['exp'] * 1000 < Date.now()) {
      return false;
    }

    const role = (payload['role'] || '') as string;
    if (role === 'owner') {
      return false;
    }

    return true;
  }
}
