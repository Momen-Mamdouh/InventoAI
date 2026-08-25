import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import { CreateFaqDto, FaqEntry, ReorderFaqItem, UpdateFaqDto } from './faq.model';

/**
 * Thin HTTP layer for the FAQ resource.
 * Auth (Authorization: Bearer <admin_access_tk>) is assumed to be attached
 * by the shared auth interceptor - not duplicated here.
 */
@Injectable({ providedIn: 'root' })
export class FaqApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(AUTH_CONFIG).apiBaseUrl}/faqs`;

  /** Dashboard list - includes unpublished, ordered by position then createdAt. Not paginated (capped at 100). */
  getAll(): Observable<FaqEntry[]> {
    return this.http.get<FaqEntry[]>(this.baseUrl);
  }

  getById(id: string): Observable<FaqEntry> {
    return this.http.get<FaqEntry>(`${this.baseUrl}/${id}`);
  }

  /** Appends to the end of the store's list. 400 if store already holds 100 entries. */
  create(dto: CreateFaqDto): Observable<FaqEntry> {
    return this.http.post<FaqEntry>(this.baseUrl, dto);
  }

  /** All fields optional; position is NOT accepted here (use reorder). */
  update(id: string, dto: UpdateFaqDto): Observable<FaqEntry> {
    return this.http.patch<FaqEntry>(`${this.baseUrl}/${id}`, dto);
  }

  /** Hard delete - nothing references an FAQ entry, so confirm in the UI first. */
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Send the WHOLE list every time. The API validates every id against the
   * store before a single write (all-or-nothing), and any id you omit just
   * keeps its old position - which can desync the UI, so always send all.
   */
  reorder(items: ReorderFaqItem[]): Observable<FaqEntry[]> {
    return this.http.patch<FaqEntry[]>(`${this.baseUrl}/reorder`, { items });
  }
}
