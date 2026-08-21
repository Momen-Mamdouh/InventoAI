import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateSupplierDto,
  Supplier,
  SupplierListResponse,
  UpdateSupplierDto,
} from './supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly http = inject(HttpClient);
  // Auth is handled by the existing HTTP interceptor — never set Authorization headers manually here.
  private readonly base = `${environment.apiUrl}/suppliers`;

  list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean | undefined;
  }): Observable<SupplierListResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.isActive !== undefined && params.isActive !== null) {
      httpParams = httpParams.set('isActive', String(params.isActive));
    }

    return this.http.get<SupplierListResponse>(this.base, { params: httpParams });
  }

  getOne(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.base}/${id}`);
  }

  create(payload: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<Supplier>(this.base, payload);
  }

  update(id: string, payload: UpdateSupplierDto): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.base}/${id}`, payload);
  }

  /** Soft delete — the supplier 404s afterwards but past deals keep the snapshotted name/email. */
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
