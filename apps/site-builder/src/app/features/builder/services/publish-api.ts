import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '@/app/core/config/api-config';

/**
 * The API validates this body strictly (`forbidNonWhitelisted`) and rejects any
 * extra property, so it must carry themeId and nothing else. Domain and
 * business name are already persisted server-side by /site-builder/domain.
 */
export interface PublishPayload {
  themeId: string;
}

export interface PublishResponse {
  message?: string;
  success?: boolean;
  publishedUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PublishApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Deliberately unguarded by fallbackOnServerError. The fallback returned
   * `{ success: true }`, so an unreachable API produced a "deployed" toast and
   * a redirect to the dashboard with nothing published. Taking a store live is
   * not an outcome that may be optimistically assumed.
   */
  publishSite(payload: PublishPayload): Observable<PublishResponse> {
    return this.http.post<PublishResponse>(this.config.url('/site-builder/publish'), payload);
  }
}
