import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
  phone: string | null;
  company: string | null;
  timeZone: string | null;
  language: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  company?: string | null;
  timeZone?: string | null;
  language?: string | null;
  image?: string | null;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActionMessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccountSettingsService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl =
    (typeof window !== 'undefined' &&
      (window as unknown as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
    inject(AUTH_CONFIG).apiBaseUrl;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiBaseUrl}/users/me`);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.apiBaseUrl}/users/me`, payload);
  }

  changePassword(payload: ChangePasswordPayload): Observable<ActionMessageResponse> {
    return this.http.patch<ActionMessageResponse>(
      `${this.apiBaseUrl}/users/change-password`,
      payload,
    );
  }
}
