import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoriesService } from './category.service';
import { Category } from './category.model';
import { toast } from '@spartan-ng/brain/sonner';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string | string[] } | undefined;
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (body?.message) return body.message;
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class CategoriesState {
  private readonly svc = inject(CategoriesService);

  private readonly _categories = signal<Category[]>([]);
  private readonly _total = signal(0);
  private readonly _page = signal(1);
  private readonly _limit = signal(10);
  private readonly _totalPages = signal(1);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _filters = signal({
    search: '',
    isPublished: undefined as boolean | undefined,
    isFeatured: undefined as boolean | undefined,
  });

  readonly categories = this._categories.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  readonly hasItems = computed(() => this._categories().length > 0);

  loadCategories(): void {
    this._loading.set(true);
    this._error.set(null);

    const f = this._filters();

    this.svc
      .list({
        page: this._page(),
        limit: this._limit(),
        search: f.search || undefined,
        isPublished: f.isPublished,
        isFeatured: f.isFeatured,
      })
      .subscribe({
        next: (res) => {
          this._categories.set(res.items || []);
          this._total.set(res.total || 0);
          this._page.set(res.page || 1);
          this._limit.set(res.limit || this._limit());
          this._totalPages.set(res.totalPages || 1);
          this._loading.set(false);
        },
        error: (err) => {
          const message = extractErrorMessage(err, 'Failed to load categories');
          console.error('Failed to load categories', err);
          this._error.set(message);
          this._loading.set(false);
        },
      });
  }

  setPage(p: number): void {
    this._page.set(p);
    this.loadCategories();
  }

  setLimit(l: number): void {
    this._limit.set(l);
    this._page.set(1);
    this.loadCategories();
  }

  setFilters(
    filters: Partial<{
      search: string;
      isPublished: boolean | undefined;
      isFeatured: boolean | undefined;
    }>,
  ) {
    this._filters.update((s) => ({ ...s, ...filters }));
    this._page.set(1);
    this.loadCategories();
  }

  /**
   * onSuccess/onError let callers (like the form dialog) know when the request has
   * actually settled, instead of optimistically closing after a fixed timeout.
   */
  createCategory(
    payload: Partial<Category>,
    onSuccess?: (category: Category) => void,
    onError?: (message: string) => void,
  ): void {
    this.svc.create(payload).subscribe({
      next: (category) => {
        this.loadCategories();
        toast.success('Category created');
        onSuccess?.(category);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Create failed');
        console.error('Create failed', err);
        this._error.set(message);
        toast.error(message);
        onError?.(message);
      },
    });
  }

  updateCategory(
    id: string,
    payload: Partial<Category>,
    onSuccess?: (category: Category) => void,
    onError?: (message: string) => void,
  ): void {
    this.svc.update(id, payload).subscribe({
      next: (category) => {
        this.loadCategories();
        toast.success('Category updated');
        onSuccess?.(category);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Update failed');
        console.error('Update failed', err);
        this._error.set(message);
        toast.error(message);
        onError?.(message);
      },
    });
  }

  deleteCategory(id: string): void {
    this._loading.set(true);
    this.svc.delete(id).subscribe({
      next: () => {
        this.loadCategories();
        toast.success('Category deleted');
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          // Already gone server-side — reconcile local state instead of erroring.
          console.warn('Category already deleted, removing locally', id);
          this._categories.update((items) => items.filter((c) => c.id !== id));
          this._total.update((t) => Math.max(0, t - 1));
          this._loading.set(false);
          toast.info('That category was already deleted');
          return;
        }
        const message = extractErrorMessage(err, 'Delete failed');
        console.error('Delete failed', err);
        this._error.set(message);
        this._loading.set(false);
        toast.error(message);
      },
    });
  }

  reorderCategories(items: { id: string; position: number }[]): void {
    this._loading.set(true);
    this.svc.reorder(items).subscribe({
      next: (res) => {
        this._categories.set(res || []);
        this._loading.set(false);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Reorder failed');
        console.error('Reorder failed', err);
        this._error.set(message);
        this._loading.set(false);
        toast.error(message);
      },
    });
  }

  /**
   * Optimistic reorder: update local list immediately, call API, rollback on error.
   */
  optimisticReorder(newOrder: Category[]): void {
    const prev = this._categories();
    this._categories.set(newOrder);

    const payload = newOrder.map((c, idx) => ({ id: c.id, position: idx + 1 }));

    this.svc.reorder(payload).subscribe({
      next: (res) => {
        this._categories.set(res || newOrder);
        toast.success('Categories reordered');
      },
      error: (err) => {
        console.error('Optimistic reorder failed, rolling back', err);
        this._categories.set(prev);
        const message = extractErrorMessage(err, 'Reorder failed');
        this._error.set(message);
        toast.error(message);
      },
    });
  }

  /**
   * Image actions are scoped to a single row/dialog, so they don't toggle the
   * page-level `loading` skeleton — callers manage their own local busy state
   * and get the fresh `Category` (with the new imageUrl) back directly.
   */
  uploadImage(
    id: string,
    file: File,
    onSuccess?: (category: Category) => void,
    onError?: (message: string) => void,
  ): void {
    this.svc.uploadImage(id, file).subscribe({
      next: (category) => {
        this._categories.update((items) => items.map((c) => (c.id === id ? category : c)));
        toast.success('Image updated');
        onSuccess?.(category);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Upload failed');
        console.error('Upload failed', err);
        toast.error(message);
        onError?.(message);
      },
    });
  }

  deleteImage(
    id: string,
    onSuccess?: (category: Category) => void,
    onError?: (message: string) => void,
  ): void {
    this.svc.deleteImage(id).subscribe({
      next: (category) => {
        this._categories.update((items) => items.map((c) => (c.id === id ? category : c)));
        toast.success('Image removed');
        onSuccess?.(category);
      },
      error: (err) => {
        const message = extractErrorMessage(err, 'Failed to remove image');
        console.error('Delete image failed', err);
        toast.error(message);
        onError?.(message);
      },
    });
  }
}
