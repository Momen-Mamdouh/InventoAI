import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductAttribute,
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  ReorderDto,
  AddAttributeValueDto,
  UpdateAttributeValueDto,
} from './attribute.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AttributeService {
  private readonly http = inject(HttpClient);
  // In a real app, this might come from an environment file.
  private readonly apiUrl = `${environment.apiUrl}/product-attributes`;

  getAttributes(): Observable<ProductAttribute[]> {
    return this.http.get<ProductAttribute[]>(this.apiUrl);
  }

  getAttributeById(id: string): Observable<ProductAttribute> {
    return this.http.get<ProductAttribute>(`${this.apiUrl}/${id}`);
  }

  createAttribute(dto: CreateProductAttributeDto): Observable<ProductAttribute> {
    return this.http.post<ProductAttribute>(this.apiUrl, dto);
  }

  updateAttribute(id: string, dto: UpdateProductAttributeDto): Observable<ProductAttribute> {
    return this.http.patch<ProductAttribute>(`${this.apiUrl}/${id}`, dto);
  }

  deleteAttribute(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  reorderAttributes(dto: ReorderDto): Observable<ProductAttribute[]> {
    return this.http.patch<ProductAttribute[]>(`${this.apiUrl}/reorder`, dto);
  }

  addAttributeValue(id: string, dto: AddAttributeValueDto): Observable<ProductAttribute> {
    return this.http.post<ProductAttribute>(`${this.apiUrl}/${id}/values`, dto);
  }

  updateAttributeValue(
    id: string,
    valueId: string,
    dto: UpdateAttributeValueDto,
  ): Observable<ProductAttribute> {
    return this.http.patch<ProductAttribute>(`${this.apiUrl}/${id}/values/${valueId}`, dto);
  }

  reorderAttributeValues(id: string, dto: ReorderDto): Observable<ProductAttribute> {
    return this.http.patch<ProductAttribute>(`${this.apiUrl}/${id}/values/reorder`, dto);
  }

  deleteAttributeValue(id: string, valueId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/values/${valueId}`);
  }
}
