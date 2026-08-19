import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiConfig } from '@/app/core/config/api-config';
import { fallbackOnServerError } from '@/app/core/http/api-fallback';

export interface ThemeItem {
  id: string;
  name: string;
  description: string;
  style: string;
  font: string;
  radius: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  isSelected: boolean;
  css: {
    basePreset: string;
    name: string;
    description: string;
    rawCss: string;
  };
}

export interface GetThemesResponse {
  themes: ThemeItem[];
}

@Injectable({ providedIn: 'root' })
export class ThemesApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  private get endpoint(): string {
    return this.config.url('/site-builder/themes');
  }

  /**
   * Deliberately unguarded by fallbackOnServerError.
   *
   * This is the only call that advances the backend draft to the `themed`
   * step, and publish refuses anything below it. Swallowing a failure here let
   * the wizard sail on to Preview, where listThemes still returned themes from
   * an earlier generation — so the store looked ready and Deploy came back 409.
   * A failed generation has to be seen.
   */
  generateThemes(): Observable<GetThemesResponse> {
    return this.http.post<GetThemesResponse>(this.endpoint, {});
  }

  getThemes(): Observable<GetThemesResponse> {
    return this.http
      .get<GetThemesResponse>(this.endpoint)
      .pipe(fallbackOnServerError(() => of({ themes: [] }), 'ThemesApi.getThemes'));
  }
}
