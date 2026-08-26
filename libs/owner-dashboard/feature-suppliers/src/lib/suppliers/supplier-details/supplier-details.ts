import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
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
import { HlmButton } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmH1, HlmH2, HlmLarge, HlmMuted, HlmSmall } from '@spartan/helm/typography';
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
  imports: [
    CurrencyPipe,
    DatePipe,
    NgClass,
    TitleCasePipe,
    RouterLink,
    NgIcon,
    HlmButton,
    HlmCardImports,
    HlmSkeleton,
    HlmTableImports,
    HlmH1,
    HlmH2,
    HlmLarge,
    HlmMuted,
    HlmSmall,
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
      replied: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    }[status];
  }

  offerClass(status: SupplierOffer['status']): string {
    return {
      awaiting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      received: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      won: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      declined: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
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
