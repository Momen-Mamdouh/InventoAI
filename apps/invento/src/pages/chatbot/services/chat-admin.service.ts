import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@invento/invento/environments/environment';
import {
  KnowledgeStatus,
  ChatSessionsResponse,
  ChatTranscript,
  UnansweredResponse,
  ChatStats,
  ChatbotSettings,
  UpdateChatbotSettingsDto,
} from '../types/chat-admin.types';

@Injectable({
  providedIn: 'root',
})
export class ChatAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Knowledge Base
  getKnowledgeStatus(): Observable<KnowledgeStatus> {
    return this.http.get<KnowledgeStatus>(`${this.apiUrl}/knowledge/status`);
  }

  rebuildKnowledgeBase(): Observable<KnowledgeStatus> {
    return this.http.post<KnowledgeStatus>(`${this.apiUrl}/knowledge/reindex`, {});
  }

  // Chat History / Transcripts
  getChatSessions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    from?: string;
    to?: string;
    hasUnanswered?: boolean;
    isSignedIn?: boolean;
  }): Observable<ChatSessionsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.from) httpParams = httpParams.set('from', params.from);
      if (params.to) httpParams = httpParams.set('to', params.to);
      if (params.hasUnanswered !== undefined)
        httpParams = httpParams.set('hasUnanswered', params.hasUnanswered);
      if (params.isSignedIn !== undefined)
        httpParams = httpParams.set('isSignedIn', params.isSignedIn);
    }
    return this.http.get<ChatSessionsResponse>(`${this.apiUrl}/chat/sessions`, {
      params: httpParams,
    });
  }

  getChatTranscript(id: string): Observable<ChatTranscript> {
    return this.http.get<ChatTranscript>(`${this.apiUrl}/chat/sessions/${id}`);
  }

  // Unanswered Questions
  getUnansweredQuestions(params?: {
    page?: number;
    limit?: number;
    days?: number;
    includeReviewed?: boolean;
  }): Observable<UnansweredResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.days) httpParams = httpParams.set('days', params.days);
      if (params.includeReviewed !== undefined)
        httpParams = httpParams.set('includeReviewed', params.includeReviewed);
    }
    return this.http.get<UnansweredResponse>(`${this.apiUrl}/chat/unanswered`, {
      params: httpParams,
    });
  }

  reviewUnansweredTheme(messageId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/chat/unanswered/${messageId}/review`,
      {}
    );
  }

  // Chat Stats
  getChatStats(days?: number): Observable<ChatStats> {
    let httpParams = new HttpParams();
    if (days) httpParams = httpParams.set('days', days);
    return this.http.get<ChatStats>(`${this.apiUrl}/chat/stats`, { params: httpParams });
  }

  // Settings
  getChatbotSettings(): Observable<ChatbotSettings> {
    return this.http.get<ChatbotSettings>(`${this.apiUrl}/chat/settings`);
  }

  updateChatbotSettings(settings: UpdateChatbotSettingsDto): Observable<ChatbotSettings> {
    return this.http.patch<ChatbotSettings>(`${this.apiUrl}/chat/settings`, settings);
  }
}
