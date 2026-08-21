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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  private apiUrl = environment.apiUrl;

  currentUser = signal<User | null>(null);

  register(data: Record<string, unknown>): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/users/register/owner`, data);
  }

  login(credentials: Record<string, unknown>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/login/owner`, credentials).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this.currentUser.set(response.user);
      }),
    );
  }

  googleLoginOwner(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/google/owner`, { idToken }).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.accessToken, response.refreshToken);
        this.currentUser.set(response.user);
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
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
