import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogApplyRequest,
  CatalogApplyResponse,
  CatalogGenerationRequest,
  CatalogGenerationResponse,
} from './catalog-ai.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogAiService {
  private http = inject(HttpClient);
  private readonly basePath = '/catalog';

  generateCatalog(request: CatalogGenerationRequest): Observable<CatalogGenerationResponse> {
    return this.http.post<CatalogGenerationResponse>(`${this.basePath}/generate`, request);
  }

  applyCatalog(request: CatalogApplyRequest): Observable<CatalogApplyResponse> {
    return this.http.post<CatalogApplyResponse>(`${this.basePath}/apply`, request);
  }
}
