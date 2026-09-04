import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import {
  CorrectOfferDto,
  CreatePurchaseRequestDto,
  MailboxConnectResponse,
  MailboxStatus,
  MailboxSyncResponse,
  PasteSupplierReplyDto,
  PurchaseRequestDetail,
  PurchaseRequestListResponse,
  PurchaseRequestStatus,
  UpdatePurchaseRequestDto,
} from './purchase-request.model';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(AUTH_CONFIG).apiBaseUrl}/purchase-requests`;
  private readonly mailboxBase = `${inject(AUTH_CONFIG).apiBaseUrl}/mailbox`;

  list(params?: {
    page?: number;
    limit?: number;
    status?: PurchaseRequestStatus;
  }): Observable<PurchaseRequestListResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<PurchaseRequestListResponse>(this.base, { params: httpParams });
  }

  get(id: string): Observable<PurchaseRequestDetail> {
    return this.http.get<PurchaseRequestDetail>(`${this.base}/${id}`);
  }

  create(payload: CreatePurchaseRequestDto): Observable<PurchaseRequestDetail> {
    return this.http.post<PurchaseRequestDetail>(this.base, payload);
  }

  update(id: string, payload: UpdatePurchaseRequestDto): Observable<PurchaseRequestDetail> {
    return this.http.patch<PurchaseRequestDetail>(`${this.base}/${id}`, payload);
  }

  send(id: string): Observable<PurchaseRequestDetail> {
    return this.http.post<PurchaseRequestDetail>(`${this.base}/${id}/send`, {});
  }

  cancel(id: string): Observable<PurchaseRequestDetail> {
    return this.http.post<PurchaseRequestDetail>(`${this.base}/${id}/cancel`, {});
  }

  pasteReply(
    id: string,
    offerId: string,
    payload: PasteSupplierReplyDto,
  ): Observable<PurchaseRequestDetail> {
    return this.http.post<PurchaseRequestDetail>(
      `${this.base}/${id}/offers/${offerId}/reply`,
      payload,
    );
  }

  correctOffer(
    id: string,
    offerId: string,
    payload: CorrectOfferDto,
  ): Observable<PurchaseRequestDetail> {
    return this.http.patch<PurchaseRequestDetail>(`${this.base}/${id}/offers/${offerId}`, payload);
  }

  confirmOffer(id: string, offerId: string): Observable<PurchaseRequestDetail> {
    return this.http.post<PurchaseRequestDetail>(
      `${this.base}/${id}/offers/${offerId}/confirm`,
      {},
    );
  }

  mailboxStatus(): Observable<MailboxStatus> {
    return this.http.get<MailboxStatus>(this.mailboxBase);
  }

  connectMailbox(): Observable<MailboxConnectResponse> {
    return this.http.post<MailboxConnectResponse>(`${this.mailboxBase}/connect`, {});
  }

  finishMailbox(code: string, state: string): Observable<MailboxStatus> {
    return this.http.post<MailboxStatus>(`${this.mailboxBase}/callback`, { code, state });
  }

  disconnectMailbox(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.mailboxBase);
  }

  syncMailbox(): Observable<MailboxSyncResponse> {
    return this.http.post<MailboxSyncResponse>(`${this.mailboxBase}/sync`, {});
  }
}
