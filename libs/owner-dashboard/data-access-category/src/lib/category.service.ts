import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryListResponse, ReorderPayloadItem } from './category.model';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  // Auth is handled by the existing HTTP interceptor — never set Authorization headers manually here.
  private readonly base = `${inject(AUTH_CONFIG).apiBaseUrl}/categories`;

  list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean | undefined;
    isFeatured?: boolean | undefined;
  }): Observable<CategoryListResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.isPublished !== undefined && params.isPublished !== null)
      httpParams = httpParams.set('isPublished', String(params.isPublished));
    if (params?.isFeatured !== undefined && params.isFeatured !== null)
      httpParams = httpParams.set('isFeatured', String(params.isFeatured));

    return this.http.get<CategoryListResponse>(`${this.base}/`, {
      params: httpParams,
    });
  }

  getOne(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.base}/${id}`);
  }

  create(payload: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.base}/`, payload);
  }

  update(id: string, payload: Partial<Category>): Observable<Category> {
    return this.http.patch<Category>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  reorder(items: ReorderPayloadItem[]): Observable<Category[]> {
    return this.http.patch<Category[]>(`${this.base}/reorder`, { items });
  }

  uploadImage(id: string, file: File): Observable<Category> {
    const fd = new FormData();
    fd.append('image', file);
    // Plain JSON response, no progress reporting — the events/observe:'events' variant
    // returns HttpEvent<Category>, not Category, so don't mix it in without unwrapping it.
    return this.http.put<Category>(`${this.base}/${id}/image`, fd);
  }

  deleteImage(id: string): Observable<Category> {
    // The API expects a (possibly empty) multipart/form-data body on delete.
    // Passing an empty FormData lets the browser set the correct multipart content-type.
    return this.http.delete<Category>(`${this.base}/${id}/image`, {
      body: new FormData(),
    });
  }
}
