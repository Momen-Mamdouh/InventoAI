import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto, Supplier, UpdateSupplierDto } from './supplier.model';

const MAX_SUPPLIERS_PER_STORE = 100;

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string | string[] } | undefined;
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (body?.message) return body.message;
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class SuppliersState {
  private readonly svc = inject(SupplierService);

  private readonly _suppliers = signal<Supplier[]>([]);
  private readonly _total = signal(0);
  private readonly _page = signal(1);
  private readonly _limit = signal(10);
  private readonly _totalPages = signal(1);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Fetched independently of the current page/search so the KPI cards stay accurate
  // no matter what the list is filtered to.
  private readonly _overallTotal = signal(0);
  private readonly _overallActive = signal(0);

  private readonly _filters = signal({
    search: '',
    isActive: undefined as boolean | undefined,
  });

  readonly suppliers = this._suppliers.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  readonly overallTotal = this._overallTotal.asReadonly();
  readonly overallActive = this._overallActive.asReadonly();
  readonly overallInactive = computed(() =>
    Math.max(0, this._overallTotal() - this._overallActive()),
  );
  readonly atCapacity = computed(() => this._overallTotal() >= MAX_SUPPLIERS_PER_STORE);
  readonly maxSuppliers = MAX_SUPPLIERS_PER_STORE;

  readonly hasItems = computed(() => this._suppliers().length > 0);

  loadSuppliers(): void {
    this._loading.set(true);
    this._error.set(null);

    const f = this._filters();

    this.svc
      .list({
        page: this._page(),
        limit: this._limit(),
        search: f.search || undefined,
        isActive: f.isActive,
      })
      .subscribe({
        next: (res) => {
          this._suppliers.set(res.items || []);
          this._total.set(res.total || 0);
          this._page.set(res.page || 1);
          this._limit.set(res.limit || this._limit());
          this._totalPages.set(res.totalPages || 1);
          this._loading.set(false);
        },
        error: (err) => {
          const message = extractErrorMessage(err, 'Failed to load suppliers');
          console.error('Failed to load suppliers', err);
          this._error.set(message);
          this._loading.set(false);
        },
      });
  }

  /** Cheap `limit: 1` calls used only for their `total`, to drive the KPI cards. */
  loadKpis(): void {
    this.svc.list({ page: 1, limit: 1 }).subscribe({
      next: (res) => this._overallTotal.set(res.total || 0),
      error: (err) => console.error('Failed to load supplier totals', err),
    });
    this.svc.list({ page: 1, limit: 1, isActive: true }).subscribe({
      next: (res) => this._overallActive.set(res.total || 0),
      error: (err) => console.error('Failed to load active supplier totals', err),
    });
  }

  private refreshAll(): void {
    this.loadSuppliers();
    this.loadKpis();
  }

  setPage(p: number): void {
    this._page.set(p);
    this.loadSuppliers();
  }

  setLimit(l: number): void {
    this._limit.set(l);
    this._page.set(1);
    this.loadSuppliers();
  }

  setFilters(filters: Partial<{ search: string; isActive: boolean | undefined }>): void {
    this._filters.update((s) => ({ ...s, ...filters }));
    this._page.set(1);
    this.loadSuppliers();
  }

  /**
   * onSuccess/onError let callers (like the form dialog) know when the request has
   * actually settled, instead of optimistically closing after a fixed timeout.
   */
  createSupplier(
    payload: CreateSupplierDto,
    onSuccess?: (supplier: Supplier) => void,
    onError?: (message: string) => void,
  ): void {
    this.svc.create(payload).subscribe({
      next: (supplier) => {
        this.refreshAll();
        toast.success('Supplier added');
        onSuccess?.(supplier);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Failed to add supplier');
        console.error('Create supplier failed', err);
        toast.error(message);
        onError?.(message);
      },
    });
  }

  updateSupplier(
    id: string,
    payload: UpdateSupplierDto,
    onSuccess?: (supplier: Supplier) => void,
    onError?: (message: string) => void,
  ): void {
    this.svc.update(id, payload).subscribe({
      next: (supplier) => {
        this.refreshAll();
        toast.success('Supplier updated');
        onSuccess?.(supplier);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Failed to update supplier');
        console.error('Update supplier failed', err);
        toast.error(message);
        onError?.(message);
      },
    });
  }

  /** Optimistic — flips the row immediately (this is the `PATCH { isActive }` shortcut, not a delete). */
  toggleActive(supplier: Supplier): void {
    const next = !supplier.isActive;
    this._suppliers.update((items) =>
      items.map((s) => (s.id === supplier.id ? { ...s, isActive: next } : s)),
    );
    this.svc.update(supplier.id, { isActive: next }).subscribe({
      next: () => {
        toast.success(next ? 'Supplier activated' : 'Supplier deactivated');
        this.loadKpis();
      },
      error: (err) => {
        this._suppliers.update((items) =>
          items.map((s) => (s.id === supplier.id ? { ...s, isActive: !next } : s)),
        );
        const message = extractErrorMessage(err, 'Failed to update supplier');
        console.error('Toggle active failed', err);
        toast.error(message);
      },
    });
  }

  deleteSupplier(id: string): void {
    this._loading.set(true);
    this.svc.delete(id).subscribe({
      next: () => {
        this.refreshAll();
        toast.success('Supplier deleted');
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          // Already gone server-side — reconcile local state instead of erroring.
          console.warn('Supplier already deleted, removing locally', id);
          this._suppliers.update((items) => items.filter((s) => s.id !== id));
          this._total.update((t) => Math.max(0, t - 1));
          this._loading.set(false);
          toast.info('That supplier was already deleted');
          this.loadKpis();
          return;
        }
        const message = extractErrorMessage(err, 'Failed to delete supplier');
        console.error('Delete supplier failed', err);
        this._loading.set(false);
        toast.error(message);
      },
    });
  }
}
