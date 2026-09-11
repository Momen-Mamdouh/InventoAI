import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiConfig } from '@invento/site-builder-data-access-preview';

export type StoreStatus = 'draft' | 'live';

export interface StoreResponse {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  logoUrl: string | null;
  description: string | null;
  heroHeadline: string | null;
  heroSubtitle: string | null;
}

@Injectable({ providedIn: 'root' })
export class StoreApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Retrieves the caller's store. Returns null if the caller has not confirmed
   * their domain yet (backend returns HTTP 409 Conflict), or if the request fails.
   */
  getMyStore(): Observable<StoreResponse | null> {
    return this.http.get<StoreResponse>(this.config.url('/stores/me')).pipe(
      catchError(() => {
        // HTTP 409 indicates the user has not confirmed a domain yet.
        return of(null);
      }),
    );
  }
}
