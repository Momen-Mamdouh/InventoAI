import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiConfig } from '@/app/core/config/api-config';
import { fallbackOnServerError } from '@/app/core/http/api-fallback';
import {
  INTERVIEW_QUESTIONS,
  InterviewQuestionConfig,
} from '@/app/features/builder/constants/interview-questions';

export interface QuestionsResponse {
  questions: InterviewQuestionConfig[];
}

/**
 * The onboarding questionnaire, served by `GET /site-builder/questions`.
 *
 * The backend owns this catalog: it validates submitted answers against the
 * same list and feeds them to the theme prompt, so a question the frontend
 * invented — or one the backend added and we never rendered — silently
 * degrades the generated store. INTERVIEW_QUESTIONS is kept only as an offline
 * fallback, not as the source of truth it used to be.
 *
 * Unlike the rest of the builder API this route carries no @Roles guard, so it
 * can be primed before the owner reaches the interview step.
 */
@Injectable({ providedIn: 'root' })
export class QuestionsApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  getQuestions(): Observable<QuestionsResponse> {
    return this.http
      .get<QuestionsResponse>(this.config.url('/site-builder/questions'))
      .pipe(fallbackOnServerError(() => of({ questions: INTERVIEW_QUESTIONS }), 'QuestionsApi'));
  }
}
