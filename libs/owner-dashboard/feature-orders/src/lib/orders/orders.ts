import { EmptyState } from '@invento/shared-ui-empty-state';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideSearch,
  lucideFilter,
  lucideCalendar,
  lucideMoreHorizontal,
  lucideEye,
  lucideCheckCircle2,
  lucideXCircle,
  lucideClock,
  lucideRefreshCw,
  lucideShoppingCart,
  lucideTrendingUp,
  lucideTrendingDown,
  lucideMinus,
  lucideTruck,
  lucideX,
  lucidePackage,
  lucideLoader2,
  lucideAlertCircle,
  lucideBan,
  lucideCheck,
  lucideArrowUpDown,
  lucideArrowUp,
  lucideArrowDown,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCheckbox } from '@spartan/helm/checkbox';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmCard } from '@spartan/helm/card';
import {
  HlmDropdownMenu,
  HlmDropdownMenuItem,
  HlmDropdownMenuSeparator,
  HlmDropdownMenuTrigger,
} from '@spartan/helm/dropdown-menu';
import { HlmInput } from '@spartan/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmTextarea } from '@spartan/helm/textarea';
import {
  HlmTable,
  HlmTHead,
  HlmTBody,
  HlmTr,
  HlmTh,
  HlmTd,
} from '@spartan/helm/table';
import {
  HlmAlertDialog,
  HlmAlertDialogContent,
} from '@spartan/helm/alert-dialog';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { OrderStatCard } from './components/order-stat-card';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import {
  OrderStore,
  type OrderListItem,
  type OrderDetail,
  type OrderStatus,
} from '@invento/owner-dashboard-data-access-order';
import { Pagination } from '@invento/shared-ui-pagination';
import {
  TableHeaderCell,
  TableColumnSortDirection,
  TableColumnFilterOption,
} from '@invento/shared-ui-table-header';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    HlmSpinner,
    CurrencyPipe,
    NgClass,
    FormsModule,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmCheckbox,
    HlmDropdownMenu,
    HlmDropdownMenuItem,
    HlmDropdownMenuSeparator,
    HlmDropdownMenuTrigger,
    HlmInput,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
    OrderStatCard,
    EmptyState,
    TranslatePipe,
    HlmSkeleton,
    HlmTable,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmTextarea,
    HlmAlertDialog,
    HlmAlertDialogContent,
    BrnAlertDialogContent,
    HlmH1,
    HlmMuted,
    Pagination,
    TableHeaderCell,
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucideSearch,
      lucideFilter,
      lucideCalendar,
      lucideMoreHorizontal,
      lucideEye,
      lucideCheckCircle2,
      lucideXCircle,
      lucideClock,
      lucideRefreshCw,
      lucideShoppingCart,
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
      lucideTruck,
      lucideX,
      lucidePackage,
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
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);

  readonly isCancelModalOpen = signal<boolean>(false);
  readonly isBulkCancel = signal<boolean>(false);
  readonly orderToCancel = signal<OrderListItem | OrderDetail | null>(null);
  readonly cancelReason = signal<string>('');

  readonly statusItemToString = (value: unknown): string => {
    const str = String(value);
    const key = `orders.filter_${str.toLowerCase()}`;
    const translated = this.localeService.translate(key);
    return translated && translated !== key ? translated : str;
  };

  readonly timeItemToString = (value: unknown): string => {
    const str = String(value);
    const keyMap: Record<string, string> = {
      all_time: 'orders.time_all',
      today: 'orders.time_today',
      this_week: 'orders.time_week',
      this_month: 'orders.time_month',
    };
    const key = keyMap[str] ?? `orders.time_${str}`;
    const translated = this.localeService.translate(key);
    return translated && translated !== key ? translated : str;
  };

  readonly colIdSearch = signal('');
  readonly colCustomerSearch = signal('');
  readonly colPaymentFilter = signal('');
  readonly colFulfillmentFilter = signal('');
  readonly colItemsSort = signal<TableColumnSortDirection>('none');

  readonly dateSortDirection = computed<TableColumnSortDirection>(() => {
    if (this.store.sortBy() !== 'createdAt') {
      return 'none';
    }
    return this.store.sortDirection() === 'ASC' ? 'asc' : 'desc';
  });

  readonly totalSortDirection = computed<TableColumnSortDirection>(() => {
    if (this.store.sortBy() !== 'totalAmount') {
      return 'none';
    }
    return this.store.sortDirection() === 'ASC' ? 'asc' : 'desc';
  });

  readonly paymentFilterOptions = computed<TableColumnFilterOption[]>(() => [
    { label: this.localeService.translate('common.all') || 'All', value: 'all' },
    { label: this.localeService.translate('orders.filter_paid') || 'Paid', value: 'paid' },
    { label: this.localeService.translate('orders.filter_pending') || 'Pending', value: 'pending' },
    { label: this.localeService.translate('orders.filter_failed') || 'Failed', value: 'failed' },
    { label: this.localeService.translate('orders.filter_refunded') || 'Refunded', value: 'refunded' },
  ]);

  readonly fulfillmentFilterOptions = computed<TableColumnFilterOption[]>(() => [
    { label: this.localeService.translate('common.all') || 'All', value: 'all' },
    { label: this.localeService.translate('orders.filter_pending') || 'Pending', value: 'pending' },
    { label: this.localeService.translate('orders.filter_confirmed') || 'Confirmed', value: 'confirmed' },
    { label: this.localeService.translate('orders.filter_shipped') || 'Shipped', value: 'shipped' },
    { label: this.localeService.translate('orders.filter_delivered') || 'Delivered', value: 'delivered' },
    { label: this.localeService.translate('orders.filter_cancelled') || 'Cancelled', value: 'cancelled' },
  ]);

  readonly displayedOrders = computed(() => {
    let list = [...this.store.orders()];
    const id = this.colIdSearch().trim().toLowerCase();
    if (id) {
      list = list.filter((o) => o.id.toLowerCase().includes(id));
    }
    const customer = this.colCustomerSearch().trim().toLowerCase();
    if (customer) {
      list = list.filter(
        (o) =>
          o.contactName?.toLowerCase().includes(customer) ||
          o.contactEmail?.toLowerCase().includes(customer),
      );
    }
    const payment = this.colPaymentFilter();
    if (payment && payment !== 'all') {
      list = list.filter((o) => (o.paymentStatus || '').toLowerCase() === payment.toLowerCase());
    }
    const fulfillment = this.colFulfillmentFilter();
    if (fulfillment && fulfillment !== 'all') {
      list = list.filter((o) => (o.status || '').toLowerCase() === fulfillment.toLowerCase());
    }
    const itemsSort = this.colItemsSort();
    if (itemsSort === 'asc') {
      list.sort((a, b) => (a.itemCount ?? 0) - (b.itemCount ?? 0));
    } else if (itemsSort === 'desc') {
      list.sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0));
    }
    return list;
  });

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

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

  readonly pageRangeStart = computed<number>(() => {
    if (this.store.totalOrdersCount() === 0) {
      return 0;
    }
    return (this.store.currentPage() - 1) * this.store.rowsPerPage() + 1;
  });

  readonly pageRangeEnd = computed<number>(() => {
    return Math.min(
      this.store.currentPage() * this.store.rowsPerPage(),
      this.store.totalOrdersCount(),
    );
  });

  readonly pageNumbers = computed<number[]>(() => {
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
    if (this.store.selectedOrderIds().size === 0) {
      return;
    }
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
    if (state === 'closed') {
      this.closeCancelModal();
    }
  }

  submitCancelOrder(): void {
    const reason = this.cancelReason().trim();
    if (!reason) {
      return;
    }

    if (this.isBulkCancel()) {
      this.store.bulkUpdateStatus('cancelled', reason, () => this.closeCancelModal());
      return;
    }

    const order = this.orderToCancel();
    if (!order) {
      return;
    }

    this.store.updateOrderStatus(order.id, 'cancelled', reason, () => this.closeCancelModal());
  }

  // Bulk actions
  bulkUpdateStatus(status: OrderStatus): void {
    this.store.bulkUpdateStatus(status);
  }

  viewDetails(order: OrderListItem, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/orders', order.id]);
  }

  resetFilters(): void {
    this.store.setSearchQuery('');
    this.store.setStatusFilter('all');
    this.store.setTimeFilter('all_time');
  }

  // Formatting helpers
  formatMinorUnits(minorUnits: number | null | undefined): number {
    if (minorUnits === null || minorUnits === undefined) {
      return 0;
    }
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
      const localeCode = this.localeService.locale() === 'ar' ? 'ar-EG' : 'en-GB';
      return d.toLocaleDateString(localeCode, {
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
      const localeCode = this.localeService.locale() === 'ar' ? 'ar-EG' : 'en-US';
      return d.toLocaleTimeString(localeCode, {
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
        return 'bg-destructive/10 text-destructive';
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'shipped':
      case 'confirmed':
      case 'processing':
        return 'bg-primary/10 text-primary';
      case 'pending':
      default:
        return 'bg-warning/10 text-warning';
    }
  }

  getPaymentBadgeClass(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-success/10 text-success';
      case 'refunded':
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      case 'unpaid':
      case 'pending':
      default:
        return 'bg-warning/10 text-warning';
    }
  }
}
