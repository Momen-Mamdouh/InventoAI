import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';
import { LocaleService } from '@invento/shared-util-i18n';
import { extractErrorMessage } from '@invento/shared-util-error';
import { PurchaseRequestService } from './purchase-request.service';
import {
  CorrectOfferDto,
  CreatePurchaseRequestDto,
  MailboxStatus,
  PasteSupplierReplyDto,
  PurchaseRequestDetail,
  PurchaseRequestStatus,
  UpdatePurchaseRequestDto,
} from './purchase-request.model';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestsState {
  private readonly api = inject(PurchaseRequestService);
  private readonly localeService = inject(LocaleService);

  private readonly _requests = signal<PurchaseRequestDetail[]>([]);
  private readonly _total = signal(0);
  private readonly _page = signal(1);
  private readonly _limit = signal(20);
  private readonly _totalPages = signal(1);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _statusFilter = signal<'all' | PurchaseRequestStatus>('all');
  private readonly _selected = signal<PurchaseRequestDetail | null>(null);
  private readonly _detailLoading = signal(false);
  private readonly _saving = signal(false);

  private readonly _mailbox = signal<MailboxStatus | null>(null);
  private readonly _mailboxLoading = signal(false);

  // Independent counters for top KPI cards
  private readonly _kpiTotal = signal(0);
  private readonly _kpiSent = signal(0);
  private readonly _kpiReplied = signal(0);
  private readonly _kpiConfirmed = signal(0);

  readonly requests = this._requests.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly statusFilter = this._statusFilter.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly saving = this._saving.asReadonly();

  readonly mailbox = this._mailbox.asReadonly();
  readonly mailboxLoading = this._mailboxLoading.asReadonly();

  readonly kpis = computed(() => ({
    total: this._kpiTotal(),
    inProgress: this._kpiSent(),
    needsDecision: this._kpiReplied(),
    confirmed: this._kpiConfirmed(),
  }));

  loadRequests(): void {
    this._loading.set(true);
    this._error.set(null);
    const status = this._statusFilter();

    this.api
      .list({
        page: this._page(),
        limit: this._limit(),
        status: status === 'all' ? undefined : status,
      })
      .subscribe({
        next: (response) => {
          this._requests.set(response.items.map((item) => ({ ...item, offers: [] })));
          this._total.set(response.total);
          this._page.set(response.page);
          this._limit.set(response.limit);
          this._totalPages.set(response.totalPages);
          this._loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          const msg = extractErrorMessage(
            err,
            this.localeService.translate('purchase_requests.toast_load_error'),
          );
          this._error.set(msg);
          this._loading.set(false);
        },
      });
  }

  loadKpis(): void {
    this.api.list({ page: 1, limit: 1 }).subscribe({
      next: (res) => this._kpiTotal.set(res.total || 0),
      error: (err) => console.error('Failed to load total requests count', err),
    });
    this.api.list({ page: 1, limit: 1, status: 'sent' }).subscribe({
      next: (res) => this._kpiSent.set(res.total || 0),
      error: (err) => console.error('Failed to load sent requests count', err),
    });
    this.api.list({ page: 1, limit: 1, status: 'replied' }).subscribe({
      next: (res) => this._kpiReplied.set(res.total || 0),
      error: (err) => console.error('Failed to load replied requests count', err),
    });
    this.api.list({ page: 1, limit: 1, status: 'confirmed' }).subscribe({
      next: (res) => this._kpiConfirmed.set(res.total || 0),
      error: (err) => console.error('Failed to load confirmed requests count', err),
    });
  }

  setStatusFilter(status: 'all' | PurchaseRequestStatus): void {
    this._statusFilter.set(status);
    this._page.set(1);
    this.loadRequests();
  }

  setPage(page: number): void {
    this._page.set(page);
    this.loadRequests();
  }

  setLimit(limit: number): void {
    this._limit.set(limit);
    this._page.set(1);
    this.loadRequests();
  }

  openDetail(id: string): void {
    this._detailLoading.set(true);
    this.api.get(id).subscribe({
      next: (detail) => {
        this._selected.set(detail);
        this._detailLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_load_error'),
        );
        this._error.set(msg);
        this._detailLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this._selected.set(null);
  }

  refreshDetail(): void {
    const current = this._selected();
    if (current) {
      this.openDetail(current.id);
    }
  }

  createRequest(
    payload: CreatePurchaseRequestDto,
    onSuccess?: (detail: PurchaseRequestDetail) => void,
    onError?: (msg: string) => void,
  ): void {
    this._saving.set(true);
    this.api.create(payload).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this.loadRequests();
        this.loadKpis();
        toast.success(this.localeService.translate('purchase_requests.toast_created'));
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
        onError?.(msg);
      },
    });
  }

  updateRequest(
    id: string,
    payload: UpdatePurchaseRequestDto,
    onSuccess?: (detail: PurchaseRequestDetail) => void,
    onError?: (msg: string) => void,
  ): void {
    this._saving.set(true);
    this.api.update(id, payload).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this._selected.set(detail);
        this.loadRequests();
        toast.success(this.localeService.translate('purchase_requests.toast_updated'));
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
        onError?.(msg);
      },
    });
  }

  sendRequest(id: string, onSuccess?: (detail: PurchaseRequestDetail) => void): void {
    this._saving.set(true);
    this.api.send(id).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this._selected.set(detail);
        this.loadRequests();
        this.loadKpis();
        toast.success(this.localeService.translate('purchase_requests.toast_sent'));
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  cancelRequest(id: string, onSuccess?: (detail: PurchaseRequestDetail) => void): void {
    this._saving.set(true);
    this.api.cancel(id).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this._selected.set(detail);
        this.loadRequests();
        this.loadKpis();
        toast.success(this.localeService.translate('purchase_requests.toast_cancelled'));
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  pasteReply(
    id: string,
    offerId: string,
    payload: PasteSupplierReplyDto,
    onSuccess?: (detail: PurchaseRequestDetail) => void,
  ): void {
    this._saving.set(true);
    this.api.pasteReply(id, offerId, payload).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this._selected.set(detail);
        this.loadRequests();
        toast.success(this.localeService.translate('purchase_requests.toast_reply_saved'));
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  correctOffer(
    id: string,
    offerId: string,
    payload: CorrectOfferDto,
    onSuccess?: (detail: PurchaseRequestDetail) => void,
  ): void {
    this._saving.set(true);
    this.api.correctOffer(id, offerId, payload).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this._selected.set(detail);
        this.loadRequests();
        toast.success(this.localeService.translate('purchase_requests.toast_offer_corrected'));
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  confirmOffer(
    id: string,
    offerId: string,
    supplierName: string,
    onSuccess?: (detail: PurchaseRequestDetail) => void,
  ): void {
    this._saving.set(true);
    this.api.confirmOffer(id, offerId).subscribe({
      next: (detail) => {
        this._saving.set(false);
        this._selected.set(detail);
        this.loadRequests();
        this.loadKpis();
        toast.success(
          this.localeService.translate('purchase_requests.toast_winner_confirmed', {
            supplier: supplierName,
          }),
        );
        onSuccess?.(detail);
      },
      error: (err: HttpErrorResponse) => {
        this._saving.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  loadMailbox(): void {
    this.api.mailboxStatus().subscribe({
      next: (status) => this._mailbox.set(status),
      error: () => this._mailbox.set(null),
    });
  }

  syncMailbox(): void {
    this._mailboxLoading.set(true);
    this.api.syncMailbox().subscribe({
      next: (res) => {
        this._mailboxLoading.set(false);
        toast.success(res.message);
        this.loadMailbox();
        if (this._selected()) {
          this.refreshDetail();
        }
      },
      error: (err: HttpErrorResponse) => {
        this._mailboxLoading.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  connectMailbox(): void {
    this._mailboxLoading.set(true);
    this.api.connectMailbox().subscribe({
      next: (res) => {
        this._mailboxLoading.set(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('invento_mailbox_state', res.state);
          window.location.assign(res.consentUrl);
        }
      },
      error: (err: HttpErrorResponse) => {
        this._mailboxLoading.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }

  disconnectMailbox(onSuccess?: () => void): void {
    this._mailboxLoading.set(true);
    this.api.disconnectMailbox().subscribe({
      next: (res) => {
        this._mailboxLoading.set(false);
        toast.success(res.message);
        this.loadMailbox();
        onSuccess?.();
      },
      error: (err: HttpErrorResponse) => {
        this._mailboxLoading.set(false);
        const msg = extractErrorMessage(
          err,
          this.localeService.translate('purchase_requests.toast_action_error'),
        );
        toast.error(msg);
      },
    });
  }
}
