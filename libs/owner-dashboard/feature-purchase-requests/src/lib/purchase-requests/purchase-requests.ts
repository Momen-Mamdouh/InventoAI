import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideArrowLeft,
  lucideCheck,
  lucideCheckCircle2,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleDollarSign,
  lucideClock3,
  lucideCloudDownload,
  lucideEdit3,
  lucideExternalLink,
  lucideLoader2,
  lucideMail,
  lucideMailCheck,
  lucidePackage,
  lucidePlus,
  lucideRefreshCw,
  lucideSend,
  lucideSettings2,
  lucideShieldCheck,
  lucideTrash2,
  lucideTruck,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { ProductService, ApiProductDetail } from '@invento/owner-dashboard-data-access-product';
import { SupplierService, Supplier } from '@invento/owner-dashboard-data-access-supplier';
import {
  MailboxStatus,
  PurchaseRequestDetail,
  PurchaseRequestService,
  PurchaseRequestStatus,
  SupplierOffer,
} from '@invento/owner-dashboard-data-access-purchase-request';

@Component({
  selector: 'app-purchase-requests',
  imports: [
    CurrencyPipe,
    DatePipe,
    NgClass,
    TitleCasePipe,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmCardImports,
    HlmInputImports,
    HlmSelectImports,
    HlmTextareaImports,
    HlmSkeleton,
  ],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideArrowLeft,
      lucideCheck,
      lucideCheckCircle2,
      lucideChevronLeft,
      lucideChevronRight,
      lucideCircleDollarSign,
      lucideClock3,
      lucideCloudDownload,
      lucideEdit3,
      lucideExternalLink,
      lucideLoader2,
      lucideMail,
      lucideMailCheck,
      lucidePackage,
      lucidePlus,
      lucideRefreshCw,
      lucideSend,
      lucideSettings2,
      lucideShieldCheck,
      lucideTrash2,
      lucideTruck,
      lucideX,
    }),
  ],
  templateUrl: './purchase-requests.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseRequests implements OnInit {
  private readonly api = inject(PurchaseRequestService);
  private readonly suppliersApi = inject(SupplierService);
  private readonly productsApi = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly requests = signal<PurchaseRequestDetail[]>([]);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = signal<PurchaseRequestDetail | null>(null);
  readonly statusFilter = signal<'all' | PurchaseRequestStatus>('all');
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly mailbox = signal<MailboxStatus | null>(null);
  readonly mailboxLoading = signal(false);
  readonly showMailbox = signal(false);
  readonly showCreate = signal(false);
  readonly showCancelConfirm = signal(false);
  readonly offerToConfirm = signal<SupplierOffer | null>(null);
  readonly showDisconnectMailboxConfirm = signal(false);
  readonly showEdit = signal(false);
  readonly showReply = signal(false);
  readonly showOfferEdit = signal(false);
  readonly selectedOffer = signal<SupplierOffer | null>(null);
  readonly createProducts = signal<ApiProductDetail[]>([]);
  readonly createSuppliers = signal<Supplier[]>([]);
  readonly createLoading = signal(false);
  readonly actionMessage = signal<string | null>(null);

  readonly createProductId = signal('');
  createVariantId = '';
  createQuantity = 1;
  createDeadline: number | null = null;
  createNote = '';
  createSupplierIds: string[] = [];

  readonly productItemToString = (id: unknown): string => {
    if (!id || typeof id !== 'string') return '';
    const prod = this.createProducts().find((p) => p.id === id);
    return prod ? prod.title : '';
  };

  readonly variantItemToString = (id: unknown): string => {
    if (!id || typeof id !== 'string') return '';
    const v = this.selectedVariantOptions().find((opt) => opt.id === id);
    return v ? `${v.sku} — ${this.variantLabel(v.attributeValues)}` : '';
  };

  editSubject = '';
  editBody = '';
  editQuantity = 1;
  editDeadline: number | null = null;
  editNote: string | null = null;
  editSupplierIds: string[] = [];

  replyBody = '';
  offerUnitMajor: number | null = null;
  offerQuantity: number | null = null;
  offerDeliveryDays: number | null = null;
  offerNotes: string | null = null;

  readonly statusTabs: { value: 'all' | PurchaseRequestStatus; label: string }[] = [
    { value: 'all', label: 'All requests' },
    { value: 'draft', label: 'Drafts' },
    { value: 'sent', label: 'Sent' },
    { value: 'replied', label: 'Needs decision' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly selectedVariantOptions = computed(() => {
    const product = this.createProducts().find((p) => p.id === this.createProductId());
    return product?.variants ?? [];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('request');
    this.load();
    this.loadMailbox();
    this.loadCreateDependencies();
    if (id) this.openDetail(id);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusFilter();
    this.api
      .list({
        page: this.page(),
        limit: this.limit(),
        status: status === 'all' ? undefined : status,
      })
      .subscribe({
        next: (response) => {
          this.requests.set(response.items.map((item) => ({ ...item, offers: [] })));
          this.total.set(response.total);
          this.page.set(response.page);
          this.limit.set(response.limit);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(this.messageFromError(err, 'Could not load purchase requests.'));
          this.loading.set(false);
        },
      });
  }

  setStatus(status: 'all' | PurchaseRequestStatus): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.load();
  }

  openDetail(id: string): void {
    this.detailLoading.set(true);
    this.api.get(id).subscribe({
      next: (detail) => {
        this.selected.set(detail);
        this.detailLoading.set(false);
        this.router.navigate([], {
          queryParams: { request: id },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      },
      error: (err) => {
        this.error.set(this.messageFromError(err, 'Could not load this purchase request.'));
        this.detailLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this.selected.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  refreshDetail(): void {
    const id = this.selected()?.id;
    if (id) this.openDetail(id);
  }

  openCreate(): void {
    this.createQuantity = 1;
    this.createDeadline = null;
    this.createNote = '';
    this.createSupplierIds = [];
    this.createProductId.set('');
    this.createVariantId = '';
    this.showCreate.set(true);
  }

  onCreateProductChange(value: string): void {
    this.createProductId.set(value);
    const variants = this.createProducts().find((p) => p.id === value)?.variants ?? [];
    this.createVariantId = variants[0]?.id ?? '';
  }

  toggleCreateSupplier(id: string): void {
    this.createSupplierIds = this.createSupplierIds.includes(id)
      ? this.createSupplierIds.filter((item) => item !== id)
      : [...this.createSupplierIds, id];
  }

  toggleEditSupplier(id: string): void {
    this.editSupplierIds = this.editSupplierIds.includes(id)
      ? this.editSupplierIds.filter((item) => item !== id)
      : [...this.editSupplierIds, id];
  }

  createRequest(): void {
    if (!this.createVariantId || this.createQuantity < 1 || this.createSupplierIds.length === 0)
      return;
    this.saving.set(true);
    this.api
      .create({
        variantId: this.createVariantId,
        quantity: this.createQuantity,
        supplierIds: this.createSupplierIds,
        neededWithinDays: this.createDeadline || undefined,
        note: this.createNote.trim() || undefined,
      })
      .subscribe({
        next: (detail) => {
          this.saving.set(false);
          this.showCreate.set(false);
          this.actionMessage.set('Purchase request draft created.');
          this.load();
          this.openDetail(detail.id);
        },
        error: (err) => this.handleActionError(err),
      });
  }

  openEdit(): void {
    const request = this.selected();
    if (!request || request.status !== 'draft') return;
    this.editSubject = request.subject;
    this.editBody = request.body;
    this.editQuantity = request.quantity;
    this.editDeadline = request.neededWithinDays;
    this.editNote = request.note;
    this.editSupplierIds = request.offers
      .map((offer) => offer.supplierId)
      .filter((id): id is string => !!id);
    this.showEdit.set(true);
  }

  saveEdit(): void {
    const request = this.selected();
    if (!request) return;
    this.saving.set(true);
    this.api
      .update(request.id, {
        subject: this.editSubject,
        body: this.editBody,
        quantity: this.editQuantity,
        neededWithinDays: this.editDeadline,
        note: this.editNote,
        supplierIds: this.editSupplierIds,
      })
      .subscribe({
        next: (detail) => {
          this.saving.set(false);
          this.showEdit.set(false);
          this.selected.set(detail);
          this.load();
        },
        error: (err) => this.handleActionError(err),
      });
  }

  send(): void {
    const request = this.selected();
    if (!request || request.status === 'confirmed' || request.status === 'cancelled') return;
    this.saving.set(true);
    this.api.send(request.id).subscribe({
      next: (detail) => {
        this.saving.set(false);
        this.selected.set(detail);
        this.load();
        this.actionMessage.set('Purchase request sent.');
      },
      error: (err) => this.handleActionError(err),
    });
  }

  cancel(): void {
    const request = this.selected();
    if (!request) return;
    this.saving.set(true);
    this.api.cancel(request.id).subscribe({
      next: (detail) => {
        this.saving.set(false);
        this.showCancelConfirm.set(false);
        this.selected.set(detail);
        this.load();
        this.actionMessage.set('Purchase request cancelled.');
      },
      error: (err) => this.handleActionError(err),
    });
  }

  openReply(offer: SupplierOffer): void {
    this.selectedOffer.set(offer);
    this.replyBody = '';
    this.showReply.set(true);
  }

  pasteReply(): void {
    const request = this.selected();
    const offer = this.selectedOffer();
    if (!request || !offer || !this.replyBody.trim()) return;
    this.saving.set(true);
    this.api.pasteReply(request.id, offer.id, { body: this.replyBody.trim() }).subscribe({
      next: (detail) => {
        this.saving.set(false);
        this.showReply.set(false);
        this.selected.set(detail);
        this.load();
      },
      error: (err) => this.handleActionError(err),
    });
  }

  openOfferEdit(offer: SupplierOffer): void {
    this.selectedOffer.set(offer);
    this.offerUnitMajor = offer.unitAmount == null ? null : offer.unitAmount / 100;
    this.offerQuantity = offer.quantity;
    this.offerDeliveryDays = offer.deliveryDays;
    this.offerNotes = offer.notes;
    this.showOfferEdit.set(true);
  }

  saveOffer(): void {
    const request = this.selected();
    const offer = this.selectedOffer();
    if (!request || !offer) return;
    this.saving.set(true);
    this.api
      .correctOffer(request.id, offer.id, {
        unitAmount: this.offerUnitMajor == null ? null : Math.round(this.offerUnitMajor * 100),
        quantity: this.offerQuantity,
        deliveryDays: this.offerDeliveryDays,
        notes: this.offerNotes,
      })
      .subscribe({
        next: (detail) => {
          this.saving.set(false);
          this.showOfferEdit.set(false);
          this.selected.set(detail);
          this.load();
        },
        error: (err) => this.handleActionError(err),
      });
  }

  confirmOffer(offer: SupplierOffer): void {
    const request = this.selected();
    if (
      !request ||
      offer.unitAmount == null ||
      request.status === 'confirmed' ||
      request.status === 'cancelled'
    )
      return;
    this.offerToConfirm.set(offer);
  }

  cancelConfirmOffer(): void {
    this.offerToConfirm.set(null);
  }

  proceedConfirmOffer(): void {
    const request = this.selected();
    const offer = this.offerToConfirm();
    if (!request || !offer) return;
    this.saving.set(true);
    this.api.confirmOffer(request.id, offer.id).subscribe({
      next: (detail) => {
        this.saving.set(false);
        this.selected.set(detail);
        this.offerToConfirm.set(null);
        this.load();
        this.actionMessage.set(`${offer.supplierName} won this request.`);
      },
      error: (err) => {
        this.offerToConfirm.set(null);
        this.handleActionError(err);
      },
    });
  }

  openSupplier(offer: SupplierOffer): void {
    if (offer.supplierId) this.router.navigate(['/suppliers', offer.supplierId]);
  }

  syncMailbox(): void {
    this.mailboxLoading.set(true);
    this.api.syncMailbox().subscribe({
      next: (response) => {
        this.mailboxLoading.set(false);
        this.actionMessage.set(response.message);
        this.loadMailbox();
        if (this.selected()) this.refreshDetail();
      },
      error: (err) => {
        this.mailboxLoading.set(false);
        this.handleActionError(err);
      },
    });
  }

  connectMailbox(): void {
    this.mailboxLoading.set(true);
    this.api.connectMailbox().subscribe({
      next: (response) => {
        this.mailboxLoading.set(false);
        if (typeof window !== 'undefined')
          sessionStorage.setItem('invento_mailbox_state', response.state);
        window.location.assign(response.consentUrl);
      },
      error: (err) => {
        this.mailboxLoading.set(false);
        this.handleActionError(err);
      },
    });
  }

  disconnectMailbox(): void {
    this.showDisconnectMailboxConfirm.set(true);
  }

  cancelDisconnectMailbox(): void {
    this.showDisconnectMailboxConfirm.set(false);
  }

  proceedDisconnectMailbox(): void {
    this.showDisconnectMailboxConfirm.set(false);
    this.mailboxLoading.set(true);
    this.api.disconnectMailbox().subscribe({
      next: (response) => {
        this.mailboxLoading.set(false);
        this.actionMessage.set(response.message);
        this.loadMailbox();
      },
      error: (err) => {
        this.mailboxLoading.set(false);
        this.handleActionError(err);
      },
    });
  }

  mailboxStateLabel(status: MailboxStatus | null): string {
    if (!status) return 'Mailbox status';
    if (!status.isSupported) return 'Mailbox unavailable';
    if (!status.isConnected) return 'Connect mailbox';
    if (status.status === 'connected') return 'Mailbox connected';
    if (status.status === 'revoked') return 'Mailbox access revoked';
    return 'Mailbox credential expired';
  }

  statusClass(status: PurchaseRequestStatus): string {
    return {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      replied: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    }[status];
  }

  offerStatusClass(status: SupplierOffer['status']): string {
    return {
      awaiting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      received: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      won: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      declined: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    }[status];
  }

  formatMoney(minor: number | null): number | null {
    return minor == null ? null : minor / 100;
  }

  variantLabel(values: { value: string }[]): string {
    return values.map((value) => value.value).join(', ') || 'Default';
  }

  private loadMailbox(): void {
    this.api
      .mailboxStatus()
      .subscribe({ next: (status) => this.mailbox.set(status), error: () => undefined });
  }

  private loadCreateDependencies(): void {
    this.createLoading.set(true);
    forkJoin({
      suppliers: this.suppliersApi.list({ page: 1, limit: 100, isActive: true }),
      products: this.productsApi.getProducts({ page: 1, limit: 100 }),
    }).subscribe({
      next: ({ suppliers, products }) => {
        this.createSuppliers.set(suppliers.items);
        const detailRequests: Observable<ApiProductDetail>[] = products.items.map((p) =>
          this.productsApi.getProductById(p.id),
        );
        if (detailRequests.length === 0) {
          this.createProducts.set([]);
          this.createLoading.set(false);
          return;
        }
        forkJoin(detailRequests).subscribe({
          next: (details) => {
            this.createProducts.set(details.filter((p) => p.variants.length > 0));
            this.createLoading.set(false);
          },
          error: () => this.createLoading.set(false),
        });
      },
      error: () => this.createLoading.set(false),
    });
  }

  private handleActionError(err: HttpErrorResponse): void {
    this.saving.set(false);
    this.error.set(this.messageFromError(err, 'The action could not be completed.'));
  }

  private messageFromError(err: HttpErrorResponse, fallback: string): string {
    const message: unknown = err?.error?.message;
    if (Array.isArray(message)) return message.join(', ');
    return typeof message === 'string' && message ? message : fallback;
  }
}
