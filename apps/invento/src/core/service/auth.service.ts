import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';
import {
  AuthResponse,
  MessageResponse,
  RefreshTokenResponse,
  RegisterResponse,
  User,
} from '../interface/auth.interface';

const USER_STORAGE_KEY = 'invento_current_user';

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
  private router = inject(Router);

  private apiUrl = environment.apiUrl;

  currentUser = signal<User | null>(this.loadStoredUser());

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
            const parts = fullName.trim().split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
          }

          const email = (payload['email'] ||
            payload['user_email'] ||
            payload['sub'] ||
            '') as string;

          if (!firstName && !lastName && email && email.includes('@')) {
            const handle = email.split('@')[0];
            const parts = handle.split(/[._-]/).filter(Boolean);
            if (parts.length >= 2) {
              firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
              lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
            } else if (parts.length === 1 && parts[0]) {
              firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
              lastName = '';
            }
          }

          if (email || firstName || lastName) {
            return {
              id: (payload['id'] || payload['sub'] || payload['userId'] || '') as string,
              firstName: firstName || 'Owner',
              lastName,
              image: (payload['image'] || null) as string | null,
              email: email || 'owner@inventoai.com',
              role: (payload['role'] || 'owner') as string,
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

  register(data: Record<string, unknown>): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/users/register/owner`, data);
  }

  login(credentials: Record<string, unknown>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/login/owner`, credentials).pipe(
      tap((response) => {
        let user = response.user;
        const rawUser = user as unknown as Record<string, unknown>;
        if ((!user.firstName || !user.lastName) && rawUser['name']) {
          const fullName = String(rawUser['name']).trim();
          const parts = fullName.split(/\s+/);
          user = {
            ...user,
            firstName: user.firstName || parts[0] || '',
            lastName: user.lastName || parts.slice(1).join(' ') || '',
          };
        }
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this.setCurrentUser(user);
      }),
    );
  }

  googleLoginOwner(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/google/owner`, { idToken }).pipe(
      tap((response) => {
        let user = response.user;
        const googlePayload = decodeJwtPayload(idToken);

        if (googlePayload) {
          const givenName = (googlePayload['given_name'] || '') as string;
          const familyName = (googlePayload['family_name'] || '') as string;
          const fullName = (googlePayload['name'] || '') as string;
          const picture = (googlePayload['picture'] || null) as string | null;

          let first = givenName;
          let last = familyName;
          if (!first && !last && fullName) {
            const parts = fullName.trim().split(/\s+/);
            first = parts[0] || '';
            last = parts.slice(1).join(' ') || '';
          }

          user = {
            ...user,
            firstName: user.firstName || first || 'Owner',
            lastName: user.lastName || last,
            image: user.image || picture,
          };
        }

        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this.setCurrentUser(user);
      }),
    );
  }

  verifyEmail(email: string, otp: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/verify-email/owner`, {
      email,
      otp,
    });
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/resend-verification/owner`, {
      email,
    });
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/forgot-password/owner`, { email });
  }

  resetPassword(data: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/users/reset-password/owner`, data);
  }

  changePassword(data: Record<string, unknown>): Observable<MessageResponse> {
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
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
