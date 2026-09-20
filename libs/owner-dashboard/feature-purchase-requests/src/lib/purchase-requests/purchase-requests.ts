import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideCheckCircle2,
  lucideChevronRight,
  lucideClock3,
  lucideMail,
  lucideMailCheck,
  lucidePackage,
  lucidePlus,
  lucideRefreshCw,
  lucideSettings2,
  lucideShieldCheck,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmSpinner } from '@spartan/helm/spinner';
import {
  HlmTable,
  HlmTHead,
  HlmTBody,
  HlmTr,
  HlmTh,
  HlmTd,
} from '@spartan/helm/table';
import { HlmToggleGroup, HlmToggleGroupItem } from '@spartan/helm/toggle-group';
import {
  HlmAlertDialog,
  HlmAlertDialogAction,
  HlmAlertDialogCancel,
  HlmAlertDialogContent,
  HlmAlertDialogDescription,
  HlmAlertDialogFooter,
  HlmAlertDialogHeader,
  HlmAlertDialogTitle,
} from '@spartan/helm/alert-dialog';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmH1, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { Pagination } from '@invento/shared-ui-pagination';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import {
  TableHeaderCell,
  TableColumnSortDirection,
  TableColumnFilterOption,
} from '@invento/shared-ui-table-header';
import {
  MailboxStatus,
  PurchaseRequestDetail,
  PurchaseRequestsState,
  PurchaseRequestStatus,
} from '@invento/owner-dashboard-data-access-purchase-request';
import { ProductService } from '@invento/owner-dashboard-data-access-product';
import { SupplierService } from '@invento/owner-dashboard-data-access-supplier';
import { PurchaseRequestDetails } from '../purchase-request-details';
import {
  PurchaseRequestCreate,
  preloadCreateDependencies,
} from '../purchase-request-create';

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [
    DatePipe,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmSkeleton,
    HlmSpinner,
    HlmTable,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmToggleGroup,
    HlmToggleGroupItem,
    HlmAlertDialog,
    HlmAlertDialogContent,
    HlmAlertDialogHeader,
    HlmAlertDialogTitle,
    HlmAlertDialogDescription,
    HlmAlertDialogFooter,
    HlmAlertDialogAction,
    HlmAlertDialogCancel,
    BrnAlertDialogContent,
    HlmH1,
    HlmMuted,
    HlmSmall,
    Pagination,
    EmptyState,
    PurchaseRequestDetails,
    PurchaseRequestCreate,
    TranslatePipe,
    TableHeaderCell,
  ],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideCheckCircle2,
      lucideChevronRight,
      lucideClock3,
      lucideMail,
      lucideMailCheck,
      lucidePackage,
      lucidePlus,
      lucideRefreshCw,
      lucideSettings2,
      lucideShieldCheck,
      lucideTrash2,
      lucideX,
    }),
  ],
  templateUrl: './purchase-requests.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseRequests implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(PurchaseRequestsState);
  private readonly localeService = inject(LocaleService);
  private readonly suppliersApi = inject(SupplierService);
  private readonly productsApi = inject(ProductService);

  readonly requests = this.state.requests;
  readonly total = this.state.total;
  readonly page = this.state.page;
  readonly limit = this.state.limit;
  readonly totalPages = this.state.totalPages;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly statusFilter = this.state.statusFilter;
  readonly selected = this.state.selected;
  readonly detailLoading = this.state.detailLoading;
  readonly mailbox = this.state.mailbox;
  readonly mailboxLoading = this.state.mailboxLoading;
  readonly kpis = this.state.kpis;

  readonly showMailbox = signal(false);
  readonly showCreate = signal(false);
  readonly showDisconnectMailboxConfirm = signal(false);

  readonly statusTabs: { value: 'all' | PurchaseRequestStatus; key: string }[] = [
    { value: 'all', key: 'purchase_requests.tab_all' },
    { value: 'draft', key: 'purchase_requests.tab_draft' },
    { value: 'sent', key: 'purchase_requests.tab_sent' },
    { value: 'replied', key: 'purchase_requests.tab_replied' },
    { value: 'confirmed', key: 'purchase_requests.tab_confirmed' },
    { value: 'cancelled', key: 'purchase_requests.tab_cancelled' },
  ];

  readonly colRequestSearch = signal('');
  readonly colSuppliersSearch = signal('');
  readonly colStatusFilter = signal('');
  readonly colQuantitySort = signal<TableColumnSortDirection>('none');
  readonly colCreatedSort = signal<TableColumnSortDirection>('none');

  readonly statusFilterOptions = computed<TableColumnFilterOption[]>(() => [
    { label: this.localeService.translate('common.all') || 'All', value: 'all' },
    {
      label: this.localeService.translate('purchase_requests.tab_draft') || 'Draft',
      value: 'draft',
    },
    {
      label: this.localeService.translate('purchase_requests.tab_sent') || 'Sent',
      value: 'sent',
    },
    {
      label: this.localeService.translate('purchase_requests.tab_replied') || 'Replied',
      value: 'replied',
    },
    {
      label: this.localeService.translate('purchase_requests.tab_confirmed') || 'Confirmed',
      value: 'confirmed',
    },
    {
      label: this.localeService.translate('purchase_requests.tab_cancelled') || 'Cancelled',
      value: 'cancelled',
    },
  ]);

  readonly displayedRequests = computed(() => {
    let list = [...this.requests()];
    const reqSearch = this.colRequestSearch().trim().toLowerCase();
    if (reqSearch) {
      list = list.filter(
        (r) =>
          r.productTitle?.toLowerCase().includes(reqSearch) ||
          r.variantLabel?.toLowerCase().includes(reqSearch) ||
          r.subject?.toLowerCase().includes(reqSearch) ||
          r.note?.toLowerCase().includes(reqSearch),
      );
    }
    const supSearch = this.colSuppliersSearch().trim().toLowerCase();
    if (supSearch) {
      list = list.filter((r) =>
        r.offers?.some((o) => o.supplierName?.toLowerCase().includes(supSearch)),
      );
    }
    const status = this.colStatusFilter();
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    const qSort = this.colQuantitySort();
    if (qSort === 'asc') {
      list.sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
    } else if (qSort === 'desc') {
      list.sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
    }
    const cSort = this.colCreatedSort();
    if (cSort === 'asc') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (cSort === 'desc') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('request');
    this.state.loadRequests();
    this.state.loadKpis();
    this.state.loadMailbox();
    preloadCreateDependencies(this.suppliersApi, this.productsApi);
    if (id) {
      this.openDetail(id);
    }
  }

  onRefresh(): void {
    this.state.loadRequests();
    this.state.loadKpis();
    this.state.loadMailbox();
  }

  onStatusChange(
    status:
      | ('all' | PurchaseRequestStatus)
      | readonly ('all' | PurchaseRequestStatus)[]
      | null
      | undefined,
  ): void {
    if (typeof status === 'string') {
      this.state.setStatusFilter(status);
    }
  }

  onPageChange(page: number): void {
    this.state.setPage(page);
  }

  openDetail(id: string): void {
    this.state.openDetail(id);
    this.router.navigate([], {
      queryParams: { request: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeDetail(): void {
    this.state.closeDetail();
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  openCreate(): void {
    this.showCreate.set(true);
  }

  closeCreate(): void {
    this.showCreate.set(false);
  }

  onRequestCreated(detail: PurchaseRequestDetail): void {
    this.closeCreate();
    this.openDetail(detail.id);
  }

  syncMailbox(): void {
    this.state.syncMailbox();
  }

  connectMailbox(): void {
    this.state.connectMailbox();
  }

  disconnectMailbox(): void {
    this.showDisconnectMailboxConfirm.set(true);
  }

  proceedDisconnectMailbox(): void {
    this.state.disconnectMailbox(() => {
      this.showDisconnectMailboxConfirm.set(false);
    });
  }

  mailboxStateLabel(status: MailboxStatus | null): string {
    if (!status) return this.localeService.translate('purchase_requests.mailbox_state_default');
    if (!status.isSupported) return this.localeService.translate('purchase_requests.mailbox_state_unavailable');
    if (!status.isConnected) return this.localeService.translate('purchase_requests.mailbox_state_connect');
    if (status.status === 'connected') return this.localeService.translate('purchase_requests.mailbox_state_connected');
    if (status.status === 'revoked') return this.localeService.translate('purchase_requests.mailbox_state_revoked');
    return this.localeService.translate('purchase_requests.mailbox_state_expired');
  }

  statusClass(status: PurchaseRequestStatus): string {
    return {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      replied: 'bg-warning/10 text-warning',
      confirmed: 'bg-success/10 text-success',
      cancelled: 'bg-destructive/10 text-destructive',
    }[status];
  }
}
