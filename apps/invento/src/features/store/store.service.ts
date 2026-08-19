import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HeroSectionResponse {
  imageUrl: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string | null;
}

export interface StoreFeaturedCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
}

export interface StoreResponse {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  logoSource: string;
  locale: string;
  currency: string;
  hero: {
    imageUrl: string;
    headline: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string | null;
  };
  theme?: unknown;
  featuredCategories: StoreFeaturedCategory[];
}

export interface StoreNotFoundResponse {
  message: string;
  error: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly tokenHeader = {
    headers: {
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZWRhNjRhMC1lZTVlLTQ0NGUtODFiNC1jNjlmOTY0NjRmNmUiLCJlbWFpbCI6Im93bmVyLmxheWFsaUBpbnZlbnRvYWkudGVzdCIsInJvbGUiOiJPV05FUiIsInN0b3JlSWQiOm51bGwsImlhdCI6MTc4Njg4NDUzNiwiZXhwIjoxNzg2OTI3NzM2fQ.uOf9gaIMA5h81eElSQLhD9FVIxX2iKGV2ZixGFpRE4I',
    },
  };
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl =
    (typeof window !== 'undefined' &&
      (window as unknown as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
    environment.apiUrl;

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (typeof localStorage !== 'undefined') {
      const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        '';
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  /**
   * Public endpoint to fetch store details by slug.
   * GET /site/{slug} — No Auth header.
   */
  getStore(slug: string): Observable<StoreResponse> {
    return this.http.get<StoreResponse>(`${this.apiBaseUrl}/site/${encodeURIComponent(slug)}`);
  }

  getHero(): Observable<HeroSectionResponse> {
    return this.http.get<HeroSectionResponse>(
      `${this.apiBaseUrl}/stores/me/hero`,
      this.tokenHeader,
    );
  }

  updateHero(formData: FormData): Observable<HeroSectionResponse> {
    return this.http.patch<HeroSectionResponse>(
      `${this.apiBaseUrl}/stores/me/hero`,
      formData,
      this.tokenHeader,
    );
  }
}
