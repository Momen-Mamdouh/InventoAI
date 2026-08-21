import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductListItem } from '../../product/types/product';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  resolution: 'answered' | 'unanswered' | 'off_topic' | 'needs_login' | 'error' | null;
  createdAt: string;
  // Payloads for the active session (not returned by GET)
  products?: ProductListItem[];
  faqs?: { id: string; question: string }[];
  order?: any | null;
  requiresLogin?: boolean;
}

export interface ChatSettings {
  isEnabled: boolean;
  greeting?: string | null;
  effectiveGreeting?: string;
  storeName?: string;
}

export interface ChatConversation {
  sessionId: string;
  isSignedIn: boolean;
  messages: ChatMessage[];
}

export interface ChatTurnResponse {
  sessionId: string;
  message: {
    id: string;
    text: string;
    createdAt: string;
  };
  resolution: 'answered' | 'unanswered' | 'off_topic' | 'needs_login' | 'error';
  products: ProductListItem[];
  faqs: { id: string; question: string }[];
  order: any | null;
  requiresLogin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getChatConversation(storeSlug: string, sessionId: string): Observable<ChatConversation> {
    return this.http.get<ChatConversation>(`${this.apiUrl}/site/${storeSlug}/chat/${sessionId}`);
  }

  getChatSettings(storeSlug: string): Observable<ChatSettings> {
    return this.http.get<ChatSettings>(`${this.apiUrl}/site/${storeSlug}/chat/settings`);
  }

  sendChatMessage(
    storeSlug: string,
    message: string,
    sessionId?: string,
  ): Observable<ChatTurnResponse> {
    const body = sessionId ? { message, sessionId } : { message };
    return this.http.post<ChatTurnResponse>(`${this.apiUrl}/site/${storeSlug}/chat`, body);
  }
}
