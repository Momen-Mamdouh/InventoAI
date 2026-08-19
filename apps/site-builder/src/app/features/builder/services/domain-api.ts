import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '@/app/core/config/api-config';

export interface ConfirmDomainPayload {
  businessName: string;
  domain: string;
}

export interface ConfirmDomainResponse {
  success?: boolean;
  slug?: string;
  storeUrl?: string;
  hint?: string | null;
}

export interface ConfirmDomainErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Injectable({ providedIn: 'root' })
export class DomainApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Deliberately unguarded by fallbackOnServerError. The backend wizard is a
   * strict ladder — each step refuses to run until the previous one advanced
   * the draft — so faking success here does not degrade gracefully, it moves
   * the failure to a later step where it surfaces as an unexplained 409.
   */
  confirmDomain(payload: ConfirmDomainPayload): Observable<ConfirmDomainResponse> {
    return this.http.post<ConfirmDomainResponse>(
      this.config.url('/site-builder/domain'),
      payload,
    );
  }
}
