import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { LocaleService } from '@invento/shared-util-i18n';
import { extractErrorMessage } from '@invento/shared-util-error';
import { FaqApiService } from './faq.api';
import {
  CreateFaqDto,
  FaqEntry,
  ReorderFaqItem,
  UpdateFaqDto,
} from './faq.model';

const MAX_ENTRIES = 100;

@Injectable({ providedIn: 'root' })
export class FaqStore {
  private readonly api = inject(FaqApiService);
  private readonly localeService = inject(LocaleService);

  private readonly _entries = signal<FaqEntry[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<'all' | 'published' | 'draft'>('all');
  readonly categoryFilter = signal<string>('all');

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isFull = computed<boolean>(() => this._entries().length >= MAX_ENTRIES);

  readonly categories = computed<string[]>(() => {
    const set = new Set<string>();
    for (const e of this._entries()) {
      const cat = e.category?.trim().toLowerCase() || 'general';
      set.add(cat);
    }
    return Array.from(set);
  });

  readonly stats = computed(() => {
    const list = this._entries();
    const published = list.filter((e) => e.isPublished).length;
    return {
      total: list.length,
      published,
      drafts: list.length - published,
      capacity: MAX_ENTRIES,
    };
  });

  readonly isFiltering = computed<boolean>(() => {
    return (
      this.searchQuery().trim().length > 0 ||
      this.statusFilter() !== 'all' ||
      this.categoryFilter() !== 'all'
    );
  });

  readonly filteredEntries = computed<FaqEntry[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const category = this.categoryFilter().toLowerCase();
    let result = this._entries();

    if (status === 'published') {
      result = result.filter((e) => e.isPublished);
    } else if (status === 'draft') {
      result = result.filter((e) => !e.isPublished);
    }

    if (category !== 'all') {
      result = result.filter(
        (e) => (e.category?.trim().toLowerCase() || 'general') === category,
      );
    }

    if (q) {
      result = result.filter(
        (e) =>
          e.question.toLowerCase().includes(q) ||
          e.answer.toLowerCase().includes(q) ||
          Boolean(e.category && e.category.toLowerCase().includes(q)),
      );
    }

    return result;
  });

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(filter: 'all' | 'published' | 'draft'): void {
    this.statusFilter.set(filter);
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter.set(category);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.categoryFilter.set('all');
  }

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const data = await firstValueFrom(this.api.getAll());
      this._entries.set(data);
    } catch (e: unknown) {
      const msg = extractErrorMessage(
        e,
        this.localeService.translate('faq.toast_load_error'),
      );
      this._error.set(msg);
      toast.error(msg);
    } finally {
      this._loading.set(false);
    }
  }

  async create(dto: CreateFaqDto): Promise<FaqEntry> {
    try {
      const created = await firstValueFrom(this.api.create(dto));
      this._entries.update((list) => [...list, created]);
      toast.success(this.localeService.translate('faq.toast_created'));
      return created;
    } catch (e: unknown) {
      const msg = extractErrorMessage(
        e,
        this.localeService.translate('faq.toast_save_error'),
      );
      toast.error(msg);
      throw e;
    }
  }

  async update(id: string, dto: UpdateFaqDto, showToast = true): Promise<FaqEntry> {
    try {
      const updated = await firstValueFrom(this.api.update(id, dto));
      this._entries.update((list) => list.map((e) => (e.id === id ? updated : e)));
      if (showToast) {
        toast.success(this.localeService.translate('faq.toast_updated'));
      }
      return updated;
    } catch (e: unknown) {
      const msg = extractErrorMessage(
        e,
        this.localeService.translate('faq.toast_save_error'),
      );
      toast.error(msg);
      throw e;
    }
  }

  async togglePublished(entry: FaqEntry): Promise<void> {
    const nextStatus = !entry.isPublished;
    await this.update(entry.id, { isPublished: nextStatus }, false);
    const statusLabel = this.localeService.translate(
      nextStatus ? 'faq.status_published' : 'faq.status_draft',
    );
    toast.success(
      this.localeService.translate('faq.toast_status_toggled', { status: statusLabel }),
    );
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.delete(id));
      this._entries.update((list) => list.filter((e) => e.id !== id));
      toast.success(this.localeService.translate('faq.toast_deleted'));
    } catch (e: unknown) {
      const msg = extractErrorMessage(
        e,
        this.localeService.translate('faq.toast_delete_error'),
      );
      toast.error(msg);
      throw e;
    }
  }

  /**
   * Optimistically reorders the local list, then confirms with the server.
   * Rolls back on failure (e.g. a stale id, or an id from another store).
   */
  async reorder(items: ReorderFaqItem[]): Promise<void> {
    const previous = this._entries();
    const positionById = new Map(items.map((i) => [i.id, i.position]));
    const optimistic = previous
      .map((e) => ({ ...e, position: positionById.get(e.id) ?? e.position }))
      .sort((a, b) => a.position - b.position);
    this._entries.set(optimistic);
    this._error.set(null);

    try {
      const result = await firstValueFrom(this.api.reorder(items));
      this._entries.set(result.slice().sort((a, b) => a.position - b.position));
      toast.success(this.localeService.translate('faq.toast_reordered'));
    } catch (e: unknown) {
      this._entries.set(previous);
      const msg = extractErrorMessage(
        e,
        this.localeService.translate('faq.toast_reorder_error'),
      );
      this._error.set(msg);
      toast.error(msg);
      throw e;
    }
  }
}
