import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiConfig } from '@invento/site-builder-data-access-preview';
import { AnswerValue } from './builder-state';

export type SiteBuildStep =
  | 'brainstormed'
  | 'answered'
  | 'domain_confirmed'
  | 'themed'
  | 'published';

export interface DraftAnswer {
  questionId: string;
  answer: AnswerValue;
}

export interface DraftResponse {
  brainstorm: string | null;
  logoUrl: string | null;
  answers: DraftAnswer[] | null;
  businessName: string | null;
  slug: string | null;
  step: SiteBuildStep | null;
}

@Injectable({ providedIn: 'root' })
export class DraftApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Retrieves the owner's active wizard draft directly from the backend.
   * Returns null if no draft exists yet or if an error occurs.
   */
  getDraft(): Observable<DraftResponse | null> {
    return this.http.get<DraftResponse>(this.config.url('/site-builder/draft')).pipe(
      catchError(() => of(null)),
    );
  }
}
