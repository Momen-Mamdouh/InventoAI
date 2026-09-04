import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '@invento/site-builder-data-access-preview';

export interface SubmitAnswersPayload {
  questions: {
    questionId: string;
    answer: string | number | number[] | null;
  }[];
}

export interface SubmitAnswersResponse {
  message: string[];
  error: string;
  statusCode: number;
}

@Injectable({ providedIn: 'root' })
export class AiInterviewApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Deliberately unguarded by fallbackOnServerError. The backend wizard is a
   * strict ladder — each step refuses to run until the previous one advanced
   * the draft — so faking success here does not degrade gracefully, it moves
   * the failure to a later step where it surfaces as an unexplained 409.
   */
  submitAnswers(payload: SubmitAnswersPayload): Observable<SubmitAnswersResponse> {
    return this.http.post<SubmitAnswersResponse>(this.config.url('/site-builder/answers'), payload);
  }
}
