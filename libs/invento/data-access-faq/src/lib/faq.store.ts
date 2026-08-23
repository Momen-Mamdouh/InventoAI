import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FaqApiService } from './faq.api';
import {
  ApiErrorBody,
  CreateFaqDto,
  FaqEntry,
  ReorderFaqItem,
  UpdateFaqDto,
} from './faq.model';

const MAX_ENTRIES = 100;

@Injectable({ providedIn: 'root' })
export class FaqStore {
  private readonly api = inject(FaqApiService);

  private readonly _entries = signal<FaqEntry[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isFull = computed(() => this._entries().length >= MAX_ENTRIES);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const data = await firstValueFrom(this.api.getAll());
      this._entries.set(data);
    } catch (e) {
      this._error.set(this.extractError(e));
    } finally {
      this._loading.set(false);
    }
  }

  async create(dto: CreateFaqDto): Promise<FaqEntry> {
    const created = await firstValueFrom(this.api.create(dto));
    this._entries.update((list) => [...list, created]);
    return created;
  }

  async update(id: string, dto: UpdateFaqDto): Promise<FaqEntry> {
    const updated = await firstValueFrom(this.api.update(id, dto));
    this._entries.update((list) => list.map((e) => (e.id === id ? updated : e)));
    return updated;
  }

  async togglePublished(entry: FaqEntry): Promise<void> {
    await this.update(entry.id, { isPublished: !entry.isPublished });
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.api.delete(id));
    this._entries.update((list) => list.filter((e) => e.id !== id));
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
    } catch (e) {
      this._entries.set(previous);
      this._error.set(this.extractError(e));
      throw e;
    }
  }

  private extractError(e: unknown): string {
    const httpError = e as { error?: ApiErrorBody };
    const msg = httpError?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg ?? 'Something went wrong. Please try again.';
  }
}
