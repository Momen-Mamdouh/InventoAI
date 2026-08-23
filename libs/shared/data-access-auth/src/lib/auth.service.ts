import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AUTH_CONFIG } from './auth-config';
import { TokenService } from './token.service';
import {
  AuthResponse,
  MessageResponse,
  RefreshTokenResponse,
  RegisterResponse,
  User,
} from './auth.interface';

/**
 * Backend endpoint families, keyed by `AUTH_CONFIG.authRole`. invento and site-builder ("owner"
 * apps) hit the `/owner`-suffixed routes; userSite ("customer" app) does not. Reproduces each
 * app's literal endpoint strings exactly — see `auth-superset.md`.
 */
const ENDPOINTS = {
  owner: {
    register: '/users/register/owner',
    login: '/users/login/owner',
    google: '/users/google/owner',
    verifyEmail: '/users/verify-email/owner',
    resendVerification: '/users/resend-verification/owner',
    forgotPassword: '/users/forgot-password/owner',
    resetPassword: '/users/reset-password/owner',
  },
  customer: {
    register: '/users/register',
    login: '/users/login/',
    google: '/users/google',
    verifyEmail: '/users/verify-email/',
    resendVerification: '/users/resend-verification/',
    forgotPassword: '/users/forgot-password/',
    resetPassword: '/users/reset-password/',
  },
} as const;

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

/** invento's JWTs (and only invento's) carry a store slug under one of these variant keys. */
function extractStoreSlug(
  payload: Record<string, unknown> | null,
  fallbackSlug: string | null,
): string | null {
  const fromPayload = (payload?.['storeSlug'] ??
    payload?.['store_slug'] ??
    payload?.['storSlug'] ??
    payload?.['slug'] ??
    null) as string | null;
  return fromPayload ?? fallbackSlug ?? null;
}

function capitalize(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** Fills in `firstName`/`lastName`/`image` from a Google ID-token payload, only where missing. */
function mergeGoogleProfile(user: User, googlePayload: Record<string, unknown> | null): User {
  if (!googlePayload) return user;

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

  return {
    ...user,
    firstName: user.firstName || first || 'Owner',
    lastName: user.lastName || last,
    image: user.image || picture,
  };
}

/**
 * The one `AuthService` for all three apps (SC-004). Superset of invento's (304 LOC) and
 * userSite's (306 LOC) implementations, with site-builder's 107-LOC version a strict subset —
 * research.md R7. Every behavioural difference is expressed through `AUTH_CONFIG`; see
 * `specs/001-nx-workspace-restructure/auth-superset.md` for the full capability matrix and the
 * rationale for each config field.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly config = inject(AUTH_CONFIG);

  private readonly endpoints = ENDPOINTS[this.config.authRole];
  private readonly excludedRoles: readonly string[] =
    this.config.authRole === 'customer' ? ['owner'] : [];

  currentUser = signal<User | null>(this.loadStoredUser());

  /**
   * Reactive form of `isAuthenticated()`. OnPush views (every component in this workspace)
   * re-render on signal change but not on a plain method call re-evaluating differently, so a
   * navbar/account-menu should read this instead of calling `isAuthenticated()` from a template.
   */
  readonly isLoggedIn = computed(() => this.currentUser() !== null && this.tokenService.hasToken());

  private get userStorageKey(): string {
    return `${this.config.tokenStorageKey}_current_user`;
  }

  private loadStoredUser(): User | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    const token = this.tokenService.getAccessToken();
    if (!token) {
      localStorage.removeItem(this.userStorageKey);
      return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      localStorage.removeItem(this.userStorageKey);
      return null;
    }

    if (typeof payload['exp'] === 'number' && payload['exp'] * 1000 < Date.now()) {
      localStorage.removeItem(this.userStorageKey);
      this.tokenService.clearTokens();
      return null;
    }

    const tokenRole = (payload['role'] || '') as string;
    if (this.excludedRoles.includes(tokenRole)) {
      localStorage.removeItem(this.userStorageKey);
      this.tokenService.clearTokens();
      return null;
    }

    try {
      const stored = localStorage.getItem(this.userStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        if (parsed && !this.excludedRoles.includes((parsed['role'] as string) || '')) {
          return this.normalizeUser(parsed, payload);
        }
      }
    } catch {
      // ignore JSON parse error
    }

    return this.normalizeUser(payload, payload);
  }

  setCurrentUser(user: User | Record<string, unknown> | null, accessToken?: string): void {
    if (!user) {
      this.currentUser.set(null);
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.userStorageKey);
      }
      return;
    }

    const token = accessToken || this.tokenService.getAccessToken();
    const payload = token ? decodeJwtPayload(token) : null;
    const normalized = this.normalizeUser(user as Record<string, unknown>, payload);

    this.currentUser.set(normalized);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (normalized) {
        localStorage.setItem(this.userStorageKey, JSON.stringify(normalized));
      } else {
        localStorage.removeItem(this.userStorageKey);
      }
    }
  }

  private normalizeUser(
    raw: Record<string, unknown> | null,
    jwtPayload: Record<string, unknown> | null,
  ): User | null {
    if (!raw && !jwtPayload) return null;

    const source = raw || jwtPayload || {};
    const fallback = jwtPayload || {};

    const fullName = (source['name'] ||
      source['fullName'] ||
      source['full_name'] ||
      fallback['name'] ||
      fallback['fullName'] ||
      '') as string;

    let firstName = (source['firstName'] ||
      source['first_name'] ||
      source['given_name'] ||
      fallback['firstName'] ||
      fallback['first_name'] ||
      fallback['given_name'] ||
      '') as string;

    let lastName = (source['lastName'] ||
      source['last_name'] ||
      source['family_name'] ||
      fallback['lastName'] ||
      fallback['last_name'] ||
      fallback['family_name'] ||
      '') as string;

    if (!firstName && !lastName && fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const email = (source['email'] ||
      source['user_email'] ||
      fallback['email'] ||
      fallback['user_email'] ||
      fallback['sub'] ||
      '') as string;

    // Derive a clean name from the email handle when nothing else supplied one
    // (e.g. mohamed.taghian@... -> Mohamed Taghian).
    if (!firstName && email) {
      const handle = email.split('@')[0];
      const parts = handle.split(/[._-]/).filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        firstName = capitalize(parts[0]);
        lastName = parts.slice(1).map(capitalize).join(' ');
      } else if (parts.length === 1 && parts[0]) {
        firstName = capitalize(parts[0]);
      }
    }

    const role = (source['role'] || fallback['role'] || this.config.authRole) as string;
    const id = (source['id'] ||
      source['userId'] ||
      source['_id'] ||
      fallback['id'] ||
      fallback['sub'] ||
      '') as string;

    const storeId = (source['storeId'] ||
      source['store_id'] ||
      fallback['storeId'] ||
      fallback['store_id'] ||
      null) as string | null;
    const storeSlug = extractStoreSlug(jwtPayload, (source['storeSlug'] as string | null) ?? null);

    return {
      id,
      firstName,
      lastName,
      image: (source['image'] ||
        source['avatar'] ||
        source['picture'] ||
        fallback['image'] ||
        null) as string | null,
      email,
      role,
      storeId,
      storeSlug,
      isEmailVerified: Boolean(source['isEmailVerified'] ?? fallback['isEmailVerified']),
      createdAt: (source['createdAt'] ||
        fallback['createdAt'] ||
        new Date().toISOString()) as string,
      updatedAt: (source['updatedAt'] ||
        fallback['updatedAt'] ||
        new Date().toISOString()) as string,
    };
  }

  register(data: Record<string, unknown>): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.config.apiBaseUrl}${this.endpoints.register}`,
      data,
    );
  }

  login(credentials: Record<string, unknown>): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.apiBaseUrl}${this.endpoints.login}`, credentials)
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          this.setCurrentUser(response.user, response.accessToken);
        }),
      );
  }

  /**
   * Owner-flow Google sign-in — always posts to `/users/google/owner` with only `{ idToken }` in
   * the body. Kept as a distinctly-named method (not synthesized from `authRole`) because the
   * moved `auth.service.spec.ts` (T060) asserts this exact name, endpoint, and body shape.
   */
  googleLoginOwner(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.apiBaseUrl}${ENDPOINTS.owner.google}`, { idToken })
      .pipe(
        tap((response) => {
          const googlePayload = decodeJwtPayload(idToken);
          const enrichedUser = mergeGoogleProfile(response.user, googlePayload);
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          this.setCurrentUser(enrichedUser, response.accessToken);
        }),
      );
  }

  /** Customer-flow (storefront) Google sign-in — scoped to a specific store. */
  googleLogin(idToken: string, storeSlug: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.apiBaseUrl}${ENDPOINTS.customer.google}`, {
        idToken,
        storeSlug,
      })
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          this.setCurrentUser(response.user, response.accessToken);
        }),
      );
  }

  verifyEmail(
    email: string,
    otp: string,
    extra?: Record<string, unknown>,
  ): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.config.apiBaseUrl}${this.endpoints.verifyEmail}`, {
      email,
      otp,
      ...extra,
    });
  }

  resendVerification(email: string, extra?: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.config.apiBaseUrl}${this.endpoints.resendVerification}`,
      { email, ...extra },
    );
  }

  forgotPassword(email: string, extra?: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.config.apiBaseUrl}${this.endpoints.forgotPassword}`,
      { email, ...extra },
    );
  }

  resetPassword(data: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.config.apiBaseUrl}${this.endpoints.resetPassword}`,
      data,
    );
  }

  changePassword(data: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.config.apiBaseUrl}/users/change-password`, data);
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(`${this.config.apiBaseUrl}/users/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
          const current = this.currentUser();
          if (current) {
            this.setCurrentUser(current, response.accessToken);
          }
        }),
      );
  }

  /** The signed-in owner's own store, if any (invento only — always `null` elsewhere). */
  getStoreSlug(): string | null {
    const user = this.currentUser();
    if (user?.storeSlug) {
      return user.storeSlug;
    }
    const token = this.tokenService.getAccessToken();
    if (token) {
      return extractStoreSlug(decodeJwtPayload(token), null);
    }
    return null;
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.setCurrentUser(null);
    this.router.navigate([`${this.config.authBasePath}/login`]);
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
    if (this.excludedRoles.includes(role)) {
      return false;
    }

    return true;
  }
}
