import { Injectable, Injector, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { ApiConfig } from '../config/api-config';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import {
  AuthResponse,
  MessageResponse,
  RefreshTokenResponse,
  RegisterResponse,
  User,
} from '../interface/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly config = inject(ApiConfig);
  private readonly injector = inject(Injector);

  private get builderState(): BuilderState {
    return this.injector.get(BuilderState);
  }

  // State for the current user
  currentUser = signal<User | null>(null);

  register(data: Record<string, unknown>): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.config.url('/users/register/owner'), data).pipe(
      tap(() => {
        this.builderState.reset();
      }),
    );
  }

  login(credentials: Record<string, unknown>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.url('/users/login/owner'), credentials).pipe(
      tap((response) => {
        this.builderState.reset();
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this.currentUser.set(response.user);
      }),
    );
  }

  verifyEmail(email: string, otp: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.config.url('/users/verify-email/owner'), {
      email,
      otp,
    });
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.config.url('/users/resend-verification/owner'), {
      email,
    });
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.config.url('/users/forgot-password/owner'), {
      email,
    });
  }

  resetPassword(data: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.config.url('/users/reset-password/owner'), data);
  }

  changePassword(data: Record<string, unknown>): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(this.config.url('/users/change-password'), data);
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(this.config.url('/users/refresh-token'), { refreshToken })
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.accessToken, response.refreshToken);
        }),
      );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.currentUser.set(null);
    this.builderState.reset();
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
