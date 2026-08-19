import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '@/app/core/config/api-config';

export interface BrainstormResponse {
  questions: {
    questionId: string;
    answer: string | number | number[] | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class BrainstormApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfig);

  /**
   * Deliberately unguarded by fallbackOnServerError. This call *creates* the
   * backend draft every later step reads, so standing in with a locally
   * derived profile did not degrade gracefully — it walked the user forward
   * with invented answers and no draft at all, and the next step then failed
   * with "Start by describing your business in the brainstorm step".
   */
  analyzePrompt(prompt: string, logo?: File): Observable<BrainstormResponse> {
    const formData = new FormData();
    formData.append('brainstorm', prompt);
    if (logo) formData.append('logo', logo);

    return this.http.post<BrainstormResponse>(
      this.config.url('/site-builder/brainstorm'),
      formData,
    );
  }
}
