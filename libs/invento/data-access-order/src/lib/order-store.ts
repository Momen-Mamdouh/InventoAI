import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { toast } from '@spartan-ng/brain/sonner';
import {
  OrderDetail,
  OrderListItem,
  OrderStatus,
  OrderStatsSummary,
  GetOrdersParams,
} from './order.model';
import { OrderService } from './order.service';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly orderService = inject(OrderService);

  readonly orders = signal<OrderListItem[]>([]);
  readonly selectedOrder = signal<OrderDetail | null>(null);

  readonly isLoading = signal<boolean>(false);
  readonly isDetailLoading = signal<boolean>(false);
  readonly isUpdatingStatus = signal<boolean>(false);
  readonly isUpdatingNote = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('all');
  readonly timeFilter = signal<string>('all_time');
  readonly currentPage = signal<number>(1);
  readonly rowsPerPage = signal<number>(10);
  readonly totalOrdersCount = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly sortBy = signal<'createdAt' | 'totalAmount'>('createdAt');
  readonly sortDirection = signal<'ASC' | 'DESC'>('DESC');
  readonly selectedOrderIds = signal<Set<string>>(new Set());

  readonly stats = signal<OrderStatsSummary>({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  readonly isAllCurrentPageSelected = computed(() => {
    const current = this.orders();
    if (current.length === 0) return false;
    const selected = this.selectedOrderIds();
    return current.every((o) => selected.has(o.id));
  });

  private getTimeFilterDates(): { fromDate?: string; toDate?: string } {
    const tf = this.timeFilter();
    const now = new Date();

    if (tf === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { fromDate: start.toISOString(), toDate: end.toISOString() };
    }

    if (tf === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      return { fromDate: start.toISOString(), toDate: new Date().toISOString() };
    }

    if (tf === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { fromDate: start.toISOString(), toDate: new Date().toISOString() };
    }

    return {};
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const { fromDate, toDate } = this.getTimeFilterDates();
    const query = this.searchQuery().trim();
    const status = this.statusFilter();

    const params: GetOrdersParams = {
      page: this.currentPage(),
      limit: this.rowsPerPage(),
      sort: this.sortBy(),
      order: this.sortDirection(),
      ...(query ? { search: query } : {}),
      ...(status && status !== 'all' ? { status: status as OrderStatus } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    };

    this.orderService
      .getOrders(params)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          const msg = this.extractErrorMessage(err) || 'Failed to load orders';
          this.error.set(msg);
          toast.error(msg);
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (res) {
          this.orders.set(res.items || []);
          this.totalOrdersCount.set(res.total || 0);
          this.totalPages.set(Math.max(1, res.totalPages || 1));
          this.currentPage.set(res.page || 1);
        }
      });
  }

  loadStats(): void {
    forkJoin({
      all: this.orderService.getOrders({ limit: 1 }).pipe(catchError(() => of(null))),
      pending: this.orderService
        .getOrders({ status: 'pending', limit: 1 })
        .pipe(catchError(() => of(null))),
      confirmed: this.orderService
        .getOrders({ status: 'confirmed', limit: 1 })
        .pipe(catchError(() => of(null))),
      shipped: this.orderService
        .getOrders({ status: 'shipped', limit: 1 })
        .pipe(catchError(() => of(null))),
      delivered: this.orderService
        .getOrders({ status: 'delivered', limit: 1 })
        .pipe(catchError(() => of(null))),
      cancelled: this.orderService
        .getOrders({ status: 'cancelled', limit: 1 })
        .pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      this.stats.set({
        total: res.all?.total ?? 0,
        pending: res.pending?.total ?? 0,
        confirmed: res.confirmed?.total ?? 0,
        shipped: res.shipped?.total ?? 0,
        delivered: res.delivered?.total ?? 0,
        cancelled: res.cancelled?.total ?? 0,
      });
    });
  }

  loadOrderDetail(id: string): void {
    this.isDetailLoading.set(true);
    this.orderService
      .getOrderById(id)
      .pipe(
        finalize(() => this.isDetailLoading.set(false)),
        catchError((err) => {
          const msg = this.extractErrorMessage(err) || 'Failed to load order details';
          toast.error(msg);
          return of(null);
        }),
      )
      .subscribe((detail) => {
        if (detail) {
          this.selectedOrder.set(detail);
        }
      });
  }

  updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
    reason?: string,
    onSuccess?: () => void,
  ): void {
    this.isUpdatingStatus.set(true);

    this.orderService
      .updateOrderStatus(id, { status: newStatus, ...(reason ? { reason } : {}) })
      .pipe(
        finalize(() => this.isUpdatingStatus.set(false)),
        catchError((err) => {
          const msg =
            this.extractErrorMessage(err) || `Failed to update order status to ${newStatus}`;
          toast.error(msg);
          return of(null);
        }),
      )
      .subscribe((updatedOrder) => {
        if (updatedOrder) {
          toast.success(`Order #${updatedOrder.orderNumber} status updated to ${newStatus}`);

          // Update current list item
          this.orders.update((list) =>
            list.map((o) =>
              o.id === id
                ? {
                    ...o,
                    status: updatedOrder.status,
                    paymentStatus: updatedOrder.paymentStatus,
                  }
                : o,
            ),
          );

          // Update detail view if matching
          if (this.selectedOrder()?.id === id) {
            this.selectedOrder.set(updatedOrder);
          }

          this.loadStats();
          if (onSuccess) onSuccess();
        }
      });
  }

  updateOrderNote(id: string, note: string, onSuccess?: () => void): void {
    this.isUpdatingNote.set(true);

    this.orderService
      .updateOrderNote(id, note)
      .pipe(
        finalize(() => this.isUpdatingNote.set(false)),
        catchError((err) => {
          const msg = this.extractErrorMessage(err) || 'Failed to update order note';
          toast.error(msg);
          return of(null);
        }),
      )
      .subscribe((updatedOrder) => {
        if (updatedOrder) {
          toast.success('Internal note saved successfully');
          if (this.selectedOrder()?.id === id) {
            this.selectedOrder.set(updatedOrder);
          }
          if (onSuccess) onSuccess();
        }
      });
  }

  bulkUpdateStatus(status: OrderStatus, reason?: string, onSuccess?: () => void): void {
    const selectedIds = Array.from(this.selectedOrderIds());
    if (selectedIds.length === 0) return;

    const currentOrders = this.orders();
    const eligibleOrders = currentOrders.filter((o) => {
      if (selectedIds.includes(o.id)) {
        if (status === 'confirmed') return o.status === 'pending';
        if (status === 'shipped') return o.status === 'confirmed';
        if (status === 'delivered') return o.status === 'shipped';
        if (status === 'cancelled') {
          return o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped';
        }
      }
      return false;
    });

    if (eligibleOrders.length === 0) {
      toast.error(`None of the selected orders can be moved to "${status}".`);
      return;
    }

    this.isUpdatingStatus.set(true);
    const requests = eligibleOrders.map((o) =>
      this.orderService
        .updateOrderStatus(o.id, { status, ...(reason ? { reason } : {}) })
        .pipe(catchError(() => of(null))),
    );

    forkJoin(requests)
      .pipe(finalize(() => this.isUpdatingStatus.set(false)))
      .subscribe((results) => {
        const successCount = results.filter((r) => r !== null).length;
        if (successCount > 0) {
          toast.success(`Updated status of ${successCount} order(s) to "${status}".`);
          this.clearSelection();
          this.loadOrders();
          this.loadStats();
          if (onSuccess) onSuccess();
        } else {
          toast.error('Failed to update status for selected orders.');
        }
      });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadOrders();
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadOrders();
  }

  setTimeFilter(timeframe: string): void {
    this.timeFilter.set(timeframe);
    this.currentPage.set(1);
    this.loadOrders();
  }

  setPage(page: number): void {
    const validPage = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(validPage);
    this.loadOrders();
  }

  setRowsPerPage(rows: number): void {
    this.rowsPerPage.set(rows);
    this.currentPage.set(1);
    this.loadOrders();
  }

  toggleSort(field: 'createdAt' | 'totalAmount'): void {
    if (this.sortBy() === field) {
      this.sortDirection.update((dir) => (dir === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('DESC');
    }
    this.currentPage.set(1);
    this.loadOrders();
  }

  toggleSelectOrder(id: string): void {
    const current = new Set(this.selectedOrderIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedOrderIds.set(current);
  }

  toggleSelectAll(): void {
    const current = this.orders();
    const selected = new Set(this.selectedOrderIds());
    const allSelected = this.isAllCurrentPageSelected();

    if (allSelected) {
      current.forEach((o) => selected.delete(o.id));
    } else {
      current.forEach((o) => selected.add(o.id));
    }
    this.selectedOrderIds.set(selected);
  }

  clearSelection(): void {
    this.selectedOrderIds.set(new Set());
  }

  exportOrders(): void {
    const list = this.orders();
    if (!list.length) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order Number',
      'Order ID',
      'Customer Name',
      'Email',
      'Date',
      'Lines Count',
      'Total Amount',
      'Currency',
      'Payment Method',
      'Payment Status',
      'Status',
    ];

    const rows = list.map((o) => [
      `#${o.orderNumber}`,
      o.id,
      `"${o.contactName.replace(/"/g, '""')}"`,
      o.contactEmail,
      o.createdAt,
      o.itemCount.toString(),
      (o.totalAmount / 100).toFixed(2),
      o.currency,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Orders exported successfully');
  }

  private extractErrorMessage(err: unknown): string | null {
    if (!err) return null;
    if (err instanceof HttpErrorResponse) {
      if (err.error?.message) {
        if (Array.isArray(err.error.message)) {
          return err.error.message.join(', ');
        }
        return String(err.error.message);
      }
      if (err.status === 409) {
        return 'This order changed while you were working on it — reload it';
      }
      if (err.status === 404) {
        return 'Order not found';
      }
      return err.message;
    }
    if (err instanceof Error) return err.message;
    return null;
  }
}
