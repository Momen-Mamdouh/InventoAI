import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import {
  ApiProductListItem,
  ApiProductDetail,
  CreateProductDto,
  UpdateProductDto,
  PaginatedResponse,
} from './product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(AUTH_CONFIG).apiBaseUrl}/products`;

  getProducts(
    params?: Record<string, string | number | boolean>,
  ): Observable<PaginatedResponse<ApiProductListItem>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    return this.http.get<PaginatedResponse<ApiProductListItem>>(this.apiUrl, {
      params: httpParams,
    });
  }

  getProductById(id: string): Observable<ApiProductDetail> {
    return this.http.get<ApiProductDetail>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: CreateProductDto): Observable<ApiProductDetail> {
    return this.http.post<ApiProductDetail>(this.apiUrl, product);
  }

  reorderProducts(items: { id: string; position: number }[]): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/reorder`, { items });
  }

  updateProduct(id: string, product: UpdateProductDto): Observable<ApiProductDetail> {
    return this.http.patch<ApiProductDetail>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // --- Product Images ---

  uploadProductImages(id: string, files: File[]): Observable<ApiProductDetail> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return this.http.post<ApiProductDetail>(`${this.apiUrl}/${id}/images`, formData);
  }

  reorderProductImages(
    id: string,
    items: { id: string; position: number }[],
  ): Observable<ApiProductDetail> {
    return this.http.patch<ApiProductDetail>(`${this.apiUrl}/${id}/images/reorder`, { items });
  }

  updateProductImage(
    id: string,
    imageId: string,
    altText: string | null,
  ): Observable<ApiProductDetail> {
    return this.http.patch<ApiProductDetail>(`${this.apiUrl}/${id}/images/${imageId}`, { altText });
  }

  deleteProductImage(id: string, imageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/images/${imageId}`);
  }

  // --- Product Variants ---

  generateVariants(
    id: string,
    payload: {
      axes: { attributeId: string; valueIds: string[] }[];
      priceAmount: number;
      stockQuantity?: number;
    },
  ): Observable<ApiProductDetail> {
    return this.http.post<ApiProductDetail>(`${this.apiUrl}/${id}/variants/generate`, payload);
  }

  addVariant(
    id: string,
    payload: {
      sku?: string | null;
      priceAmount: number;
      compareAtAmount?: number | null;
      stockQuantity?: number;
      lowStockThreshold?: number;
      attributeValueIds?: string[];
    },
  ): Observable<ApiProductDetail> {
    return this.http.post<ApiProductDetail>(`${this.apiUrl}/${id}/variants`, payload);
  }

  updateVariant(
    id: string,
    variantId: string,
    payload: {
      sku?: string | null;
      priceAmount?: number;
      compareAtAmount?: number | null;
      stockQuantity?: number;
      lowStockThreshold?: number;
      attributeValueIds?: string[];
    },
  ): Observable<ApiProductDetail> {
    return this.http.patch<ApiProductDetail>(`${this.apiUrl}/${id}/variants/${variantId}`, payload);
  }

  deleteVariant(id: string, variantId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/variants/${variantId}`);
  }

  reorderVariants(
    id: string,
    items: { id: string; position: number }[],
  ): Observable<ApiProductDetail> {
    return this.http.patch<ApiProductDetail>(`${this.apiUrl}/${id}/variants/reorder`, { items });
  }
}
