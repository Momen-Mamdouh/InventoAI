import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import {
  FilterResponse,
  ProductListResponse,
  ProductQueryParams,
  ProductSuggestion,
  ProductDetail,
} from './product';

@Injectable({
  providedIn: 'root',
})
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(AUTH_CONFIG).apiBaseUrl;

  private buildHttpParams(queryParams: ProductQueryParams): HttpParams {
    let params = new HttpParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return params;
  }

  getProducts(storeSlug: string, queryParams: ProductQueryParams): Observable<ProductListResponse> {
    const params = this.buildHttpParams(queryParams);
    return this.http
      .get<ProductListResponse>(`${this.apiUrl}/site/${storeSlug}/products`, { params })
      .pipe(tap((res) => console.log('[API: getProducts] Response:', res)));
  }

  getProductSuggestions(storeSlug: string, search: string): Observable<ProductSuggestion[]> {
    const params = new HttpParams().set('search', search).set('limit', '5');
    return this.http
      .get<ProductSuggestion[]>(`${this.apiUrl}/site/${storeSlug}/products/suggest`, { params })
      .pipe(tap((res) => console.log('[API: getProductSuggestions] Response:', res)));
  }

  getProductBySlug(storeSlug: string, productSlug: string): Observable<ProductDetail> {
    return this.http
      .get<ProductDetail>(`${this.apiUrl}/site/${storeSlug}/products/${productSlug}`)
      .pipe(tap((res) => console.log('[API: getProductBySlug] Response:', res)));
  }

  getFilters(storeSlug: string, queryParams: ProductQueryParams): Observable<FilterResponse> {
    const params = this.buildHttpParams(queryParams);
    return this.http
      .get<FilterResponse>(`${this.apiUrl}/site/${storeSlug}/filters`, { params })
      .pipe(tap((res) => console.log('[API: getFilters] Response:', res)));
  }
}
