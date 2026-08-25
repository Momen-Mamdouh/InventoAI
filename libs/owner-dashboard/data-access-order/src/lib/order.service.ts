import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import {
  OrderDetail,
  OrdersListResponse,
  GetOrdersParams,
  UpdateOrderStatusDto,
  UpdateOrderNoteDto,
} from './order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(AUTH_CONFIG).apiBaseUrl}/orders`;

  getOrders(params?: GetOrdersParams): Observable<OrdersListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          httpParams = httpParams.append(key, String(value));
        }
      });
    }
    return this.http.get<OrdersListResponse>(this.apiUrl, { params: httpParams });
  }

  getOrderById(id: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.apiUrl}/${id}`);
  }

  updateOrderStatus(id: string, payload: UpdateOrderStatusDto): Observable<OrderDetail> {
    return this.http.patch<OrderDetail>(`${this.apiUrl}/${id}/status`, payload);
  }

  updateOrderNote(id: string, internalNote: string): Observable<OrderDetail> {
    const payload: UpdateOrderNoteDto = { internalNote };
    return this.http.patch<OrderDetail>(`${this.apiUrl}/${id}/note`, payload);
  }
}
