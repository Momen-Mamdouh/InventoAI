import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl =
    (typeof window !== 'undefined' &&
      (window as unknown as { __ENV__?: { API_BASE_URL?: string } }).__ENV__?.API_BASE_URL) ||
    environment.apiUrl;

  /**
   * Public endpoint to fetch store details by slug.
   * GET /site/{slug} — No Auth header.
   */
  getStore(slug: string): Observable<StoreResponse> {
    return this.http.get<StoreResponse>(`${this.apiBaseUrl}/site/${encodeURIComponent(slug)}`);
  }

  getHero(): Observable<HeroSectionResponse> {
    return this.http.get<HeroSectionResponse>(`${this.apiBaseUrl}/stores/me/hero`);
  }

  updateHero(formData: FormData): Observable<HeroSectionResponse> {
    return this.http.patch<HeroSectionResponse>(`${this.apiBaseUrl}/stores/me/hero`, formData);
  }
}
