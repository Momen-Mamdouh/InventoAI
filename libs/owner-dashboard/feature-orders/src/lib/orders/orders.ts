import { EmptyState } from '@invento/shared-ui-empty-state';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideSearch,
  lucideFilter,
  lucideCalendar,
  lucideChevronRight,
  lucideMoreHorizontal,
  lucideEye,
  lucideCheckCircle2,
  lucideXCircle,
  lucideClock,
  lucideRefreshCw,
  lucideShoppingCart,
  lucideChevronLeft,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideTrendingUp,
  lucideTrendingDown,
  lucideMinus,
  lucideTruck,
  lucideX,
  lucidePackageCheck,
  lucidePackage,
  lucideMapPin,
  lucideUser,
  lucideMail,
  lucidePhone,
  lucideFileText,
  lucideSave,
  lucideLoader2,
  lucideAlertCircle,
  lucideBan,
  lucideCheck,
  lucideArrowUpDown,
  lucideArrowUp,
  lucideArrowDown,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmCheckboxImports } from '@spartan/helm/checkbox';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmDropdownMenuImports } from '@spartan/helm/dropdown-menu';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { HlmAlertDialogImports } from '@spartan/helm/alert-dialog';
// Brain primitives are the plain npm package — they are NOT re-exported through the
// project's `@spartan/helm` alias, so import them directly instead of reaching into
// node_modules' compiled type declarations (which is fragile and breaks on upgrades).
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { OrderStatCard } from './components/order-stat-card';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { HlmH1, HlmH2, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import {
  OrderStore,
  type OrderListItem,
  type OrderDetail,
  type OrderStatus,
} from '@invento/owner-dashboard-data-access-order';

@Component({
  selector: 'app-orders',
  imports: [
    HlmSpinner,
    CurrencyPipe,
    NgClass,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmCardImports,
    HlmDropdownMenuImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSelectImports,
    OrderStatCard,
    EmptyState,
    TranslatePipe,
    HlmSkeleton,
    HlmTableImports,
    HlmTextareaImports,
    HlmDialogImports,
    HlmAlertDialogImports,
    BrnDialogImports,
    BrnAlertDialogImports,
    HlmH1,
    HlmH2,
    HlmMuted,
    HlmSmall,
    HlmCheckboxImports,
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucideSearch,
      lucideFilter,
      lucideCalendar,
      lucideChevronRight,
      lucideMoreHorizontal,
      lucideEye,
      lucideCheckCircle2,
      lucideXCircle,
      lucideClock,
      lucideRefreshCw,
      lucideShoppingCart,
      lucideChevronLeft,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
      lucideTruck,
      lucideX,
      lucidePackageCheck,
      lucidePackage,
      lucideMapPin,
      lucideUser,
      lucideMail,
      lucidePhone,
      lucideFileText,
      lucideSave,
      lucideLoader2,
      lucideAlertCircle,
      lucideBan,
      lucideCheck,
      lucideArrowUpDown,
      lucideArrowUp,
      lucideArrowDown,
    }),
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Orders implements OnInit, OnDestroy {
  readonly store = inject(OrderStore);

  readonly isDetailsOpen = signal<boolean>(false);
  readonly isCancelModalOpen = signal<boolean>(false);
  readonly isBulkCancel = signal<boolean>(false);
  readonly orderToCancel = signal<OrderListItem | OrderDetail | null>(null);
  readonly cancelReason = signal<string>('');
  readonly internalNoteDraft = signal<string>('');

  private readonly statusFilterLabels: Record<string, string> = {
    all: 'All statuses',
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  private readonly timeFilterLabels: Record<string, string> = {
    all_time: 'All time',
    today: 'Today',
    this_week: 'This week',
    this_month: 'This month',
  };

  readonly statusItemToString = (value: string): string => this.statusFilterLabels[value] ?? value;

  readonly timeItemToString = (value: string): string => this.timeFilterLabels[value] ?? value;

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor() {
    // Sync note draft whenever selectedOrder changes
    effect(() => {
      const selected = this.store.selectedOrder();
      if (selected) {
        this.internalNoteDraft.set(selected.internalNote || '');
      }
    });
  }

  ngOnInit(): void {
    this.store.loadOrders();
    this.store.loadStats();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.store.setSearchQuery(query);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  readonly pageRangeStart = computed(() => {
    if (this.store.totalOrdersCount() === 0) return 0;
    return (this.store.currentPage() - 1) * this.store.rowsPerPage() + 1;
  });

  readonly pageRangeEnd = computed(() => {
    return Math.min(
      this.store.currentPage() * this.store.rowsPerPage(),
      this.store.totalOrdersCount(),
    );
  });

  readonly pageNumbers = computed(() => {
    const total = this.store.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  onSort(field: 'createdAt' | 'totalAmount'): void {
    this.store.toggleSort(field);
  }

  onSearchInput(value: string | Event): void {
    const query = typeof value === 'string' ? value : (value.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  onStatusFilterChange(value: string | null | undefined): void {
    this.store.setStatusFilter(value ?? 'all');
  }

  onTimeFilterChange(value: string | null | undefined): void {
    this.store.setTimeFilter(value ?? 'all_time');
  }

  onRowsPerPageChange(value: string | null | undefined): void {
    this.store.setRowsPerPage(Number(value ?? this.store.rowsPerPage()));
  }

  // State machine actions
  confirmOrder(orderId: string): void {
    this.store.updateOrderStatus(orderId, 'confirmed');
  }

  shipOrder(orderId: string): void {
    this.store.updateOrderStatus(orderId, 'shipped');
  }

  deliverOrder(orderId: string): void {
    this.store.updateOrderStatus(orderId, 'delivered');
  }

  openCancelModal(order: OrderListItem | OrderDetail): void {
    this.isBulkCancel.set(false);
    this.orderToCancel.set(order);
    this.cancelReason.set('');
    this.isCancelModalOpen.set(true);
  }

  openBulkCancelModal(): void {
    if (this.store.selectedOrderIds().size === 0) return;
    this.isBulkCancel.set(true);
    this.orderToCancel.set(null);
    this.cancelReason.set('');
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.isCancelModalOpen.set(false);
    this.isBulkCancel.set(false);
    this.orderToCancel.set(null);
    this.cancelReason.set('');
  }

  onCancelModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeCancelModal();
  }

  submitCancelOrder(): void {
    const reason = this.cancelReason().trim();
    if (!reason) return;

    if (this.isBulkCancel()) {
      this.store.bulkUpdateStatus('cancelled', reason, () => this.closeCancelModal());
      return;
    }

    const order = this.orderToCancel();
    if (!order) return;

    this.store.updateOrderStatus(order.id, 'cancelled', reason, () => this.closeCancelModal());
  }

  // Bulk actions
  bulkUpdateStatus(status: OrderStatus): void {
    this.store.bulkUpdateStatus(status);
  }

  viewDetails(order: OrderListItem, event?: Event): void {
    event?.stopPropagation();
    this.isDetailsOpen.set(true);
    this.store.loadOrderDetail(order.id);
  }

  closeDetails(): void {
    this.isDetailsOpen.set(false);
    this.store.selectedOrder.set(null);
  }

  onDetailsStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeDetails();
  }

  saveInternalNote(): void {
    const order = this.store.selectedOrder();
    const note = this.internalNoteDraft().trim();
    if (!order || !note) return;
    this.store.updateOrderNote(order.id, note);
  }

  resetFilters(): void {
    this.store.setSearchQuery('');
    this.store.setStatusFilter('all');
    this.store.setTimeFilter('all_time');
  }

  // Formatting helpers
  formatMinorUnits(minorUnits: number | null | undefined): number {
    if (minorUnits === null || minorUnits === undefined) return 0;
    return minorUnits / 100;
  }

  canConfirm(status: OrderStatus | string): boolean {
    return status === 'pending';
  }

  canShip(status: OrderStatus | string): boolean {
    return status === 'confirmed';
  }

  canDeliver(status: OrderStatus | string): boolean {
    return status === 'shipped';
  }

  canCancel(status: OrderStatus | string): boolean {
    return status === 'pending' || status === 'confirmed' || status === 'shipped';
  }

  isTerminal(status: OrderStatus | string): boolean {
    return status === 'delivered' || status === 'cancelled';
  }

  getDatePart(dateString: string): string {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString.split('T')[0] ?? dateString;
    }
  }

  getTimePart(dateString: string): string {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString.split('T')[1]?.slice(0, 5) ?? '';
    }
  }

  getFulfillmentBadgeClass(status: string): string {
    switch (status) {
      case 'cancelled':
        return 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 font-medium';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 font-medium';
      case 'shipped':
        return 'bg-sky-50 text-sky-600 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60 font-medium';
      case 'confirmed':
      case 'processing':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60 font-medium';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 font-medium';
    }
  }

  getPaymentBadgeClass(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'refunded':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'failed':
        return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'unpaid':
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  }

  getObjectKeys(obj: Record<string, string> | undefined | null): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
