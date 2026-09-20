import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBuilding2,
  lucideCheckCircle2,
  lucideClock3,
  lucideMail,
  lucidePackage,
  lucidePhone,
  lucideRefreshCw,
  lucideTruck,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import {
  HlmTable,
  HlmTHead,
  HlmTBody,
  HlmTr,
  HlmTh,
  HlmTd,
  HlmTableContainer,
} from '@spartan/helm/table';
import { TableHeaderCell, SortDirection, FilterOption } from '@invento/shared-ui-table-header';
import { Pagination } from '@invento/shared-ui-pagination';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { HlmAlert, HlmAlertDescription } from '@spartan/helm/alert';
import { HlmH1, HlmH2, HlmLarge, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { HlmTooltip } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { computed } from '@angular/core';
import { SupplierService, Supplier } from '@invento/owner-dashboard-data-access-supplier';
import {
  PurchaseRequestDetail,
  PurchaseRequestService,
  PurchaseRequestStatus,
  SupplierOffer,
} from '@invento/owner-dashboard-data-access-purchase-request';

interface SupplierRequestHistory {
  request: PurchaseRequestDetail;
  offer: SupplierOffer;
}

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    RouterLink,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmSkeleton,
    HlmTable,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmTableContainer,
    TableHeaderCell,
    Pagination,
    EmptyState,
    HlmAlert,
    HlmAlertDescription,
    HlmH1,
    HlmH2,
    HlmLarge,
    HlmMuted,
    HlmSmall,
    HlmTooltip,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideBuilding2,
      lucideCheckCircle2,
      lucideClock3,
      lucideMail,
      lucidePackage,
      lucidePhone,
      lucideRefreshCw,
      lucideTruck,
    }),
  ],
  templateUrl: './supplier-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly supplierApi = inject(SupplierService);
  private readonly purchaseApi = inject(PurchaseRequestService);

  readonly supplier = signal<Supplier | null>(null);
  readonly history = signal<SupplierRequestHistory[]>([]);
  readonly loading = signal(true);
  readonly historyLoading = signal(true);
  readonly error = signal<string | null>(null);

  // History Table Signals & Pagination
  readonly historyPage = signal<number>(1);
  readonly historyPageSize = signal<number>(5);
  readonly historySortCol = signal<'quantity' | 'amount' | 'delivery' | 'date' | null>(null);
  readonly historySortDir = signal<SortDirection>(null);
  readonly historySearchProduct = signal<string>('');
  readonly historyFilterStatus = signal<string>('');

  readonly historyStatusOptions: FilterOption[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
  ];

  readonly processedHistory = computed(() => {
    let list = [...this.history()];

    // Search Product
    const prodQ = this.historySearchProduct().trim().toLowerCase();
    if (prodQ) {
      list = list.filter((item) =>
        item.request.productTitle.toLowerCase().includes(prodQ),
      );
    }

    // Filter Status
    const statusF = this.historyFilterStatus();
    if (statusF) {
      list = list.filter((item) => item.offer.status.toLowerCase() === statusF.toLowerCase());
    }

    // Sort
    const col = this.historySortCol();
    const dir = this.historySortDir();
    if (col && dir) {
      list.sort((a, b) => {
        let diff = 0;
        if (col === 'quantity') {
          diff = a.request.quantity - b.request.quantity;
        } else if (col === 'amount') {
          diff = (a.offer.unitAmount ?? 0) - (b.offer.unitAmount ?? 0);
        } else if (col === 'delivery') {
          diff = (a.offer.deliveryDays ?? 0) - (b.offer.deliveryDays ?? 0);
        } else if (col === 'date') {
          diff = new Date(a.request.createdAt).getTime() - new Date(b.request.createdAt).getTime();
        }
        return dir === 'asc' ? diff : -diff;
      });
    }

    return list;
  });

  readonly totalHistoryPages = computed(() => {
    const total = this.processedHistory().length;
    return Math.max(1, Math.ceil(total / this.historyPageSize()));
  });

  readonly paginatedHistory = computed(() => {
    const start = (this.historyPage() - 1) * this.historyPageSize();
    return this.processedHistory().slice(start, start + this.historyPageSize());
  });

  onHistorySortChange(col: 'quantity' | 'amount' | 'delivery' | 'date', dir: SortDirection): void {
    this.historySortCol.set(dir ? col : null);
    this.historySortDir.set(dir);
  }

  onHistorySearchChange(q: string): void {
    this.historySearchProduct.set(q);
    this.historyPage.set(1);
  }

  onHistoryStatusFilterChange(val: string): void {
    this.historyFilterStatus.set(val);
    this.historyPage.set(1);
  }

  onHistoryPageChange(p: number): void {
    this.historyPage.set(p);
  }

  resetHistoryFilters(): void {
    this.historySearchProduct.set('');
    this.historyFilterStatus.set('');
    this.historySortCol.set(null);
    this.historySortDir.set(null);
    this.historyPage.set(1);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.historyLoading.set(true);
    this.error.set(null);

    forkJoin({ supplier: this.supplierApi.getOne(id), requests: this.loadAllRequests() }).subscribe(
      {
        next: ({ supplier, requests }) => {
          this.supplier.set(supplier);
          const history = requests
            .map((request) => ({
              request,
              offer: request.offers.find((offer) => offer.supplierId === supplier.id),
            }))
            .filter((item): item is SupplierRequestHistory => !!item.offer)
            .sort(
              (a, b) =>
                new Date(b.request.createdAt).getTime() - new Date(a.request.createdAt).getTime(),
            );
          this.history.set(history);
          this.loading.set(false);
          this.historyLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Could not load supplier details.');
          this.loading.set(false);
          this.historyLoading.set(false);
        },
      },
    );
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

  offerClass(status: SupplierOffer['status']): string {
    return {
      awaiting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      received: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      won: 'bg-success/10 text-success',
      declined: 'bg-destructive/10 text-destructive',
    }[status];
  }

  private loadAllRequests(): Observable<PurchaseRequestDetail[]> {
    return this.purchaseApi.list({ page: 1, limit: 100 }).pipe(
      switchMap((first) => {
        const remaining = Array.from(
          { length: Math.max(0, first.totalPages - 1) },
          (_, index) => index + 2,
        ).map((page) => this.purchaseApi.list({ page, limit: first.limit }));
        if (!remaining.length) return of(first.items);
        return forkJoin(remaining).pipe(
          map((pages) => [...first.items, ...pages.flatMap((page) => page.items)]),
        );
      }),
      switchMap((summaries) => {
        const details = summaries.map((summary) =>
          this.purchaseApi.get(summary.id).pipe(catchError(() => of(null))),
        );
        if (!details.length) return of([] as PurchaseRequestDetail[]);
        return forkJoin(details).pipe(
          map((items) => items.filter((item): item is PurchaseRequestDetail => !!item)),
        );
      }),
    );
  }
}
