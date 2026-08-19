import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideLoader2,
  lucideRefreshCw,
  lucideFolderOpen,
  lucideGripVertical,
  lucidePencil,
  lucideTrash2,
  lucideChevronsLeft,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsRight,
  lucideSearch,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmSkeletonImports } from '@spartan/helm/skeleton';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmAlertImports } from '@spartan/helm/alert';
import { CategoryFormDialog } from './category-form-dialog';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { Category } from '../../features/categories/category.model';
import { CategoriesState } from '../../features/categories/categories-state';

type PublishedFilter = 'all' | 'published' | 'unpublished';
type FeaturedFilter = 'all' | 'featured' | 'unfeatured';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmBadgeImports,
    HlmCardImports,
    HlmSkeletonImports,
    HlmTableImports,
    HlmSelectImports,
    HlmInputImports,
    HlmAlertImports,
    DragDropModule,
    CategoryFormDialog,
    DeleteConfirmDialog,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideLoader2,
      lucideRefreshCw,
      lucideFolderOpen,
      lucideGripVertical,
      lucidePencil,
      lucideTrash2,
      lucideChevronsLeft,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsRight,
      lucideSearch,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories implements OnInit, OnDestroy {
  private readonly state = inject(CategoriesState);

  readonly categories = this.state.categories;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly store = this.state;

  readonly isFormOpen = signal(false);
  readonly editing = signal<Category | null>(null);
  readonly isDeleteOpen = signal(false);
  readonly toDelete = signal<Category | null>(null);

  readonly searchTerm = signal('');
  readonly publishedFilter = signal<PublishedFilter>('all');
  readonly featuredFilter = signal<FeaturedFilter>('all');

  private readonly publishedFilterLabels: Record<PublishedFilter, string> = {
    all: 'All statuses',
    published: 'Published',
    unpublished: 'Unpublished',
  };

  private readonly featuredFilterLabels: Record<FeaturedFilter, string> = {
    all: 'All categories',
    featured: 'Featured',
    unfeatured: 'Not featured',
  };

  // hlm-select-value shows the raw bound value unless the select is given an
  // itemToString mapper — without this it would literally render "all"/"published"/etc.
  readonly publishedItemToString = (value: PublishedFilter): string =>
    this.publishedFilterLabels[value] ?? '';

  readonly featuredItemToString = (value: FeaturedFilter): string =>
    this.featuredFilterLabels[value] ?? '';

  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.state.loadCategories();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchDebounce);
  }

  onRefresh(): void {
    this.state.loadCategories();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.state.setFilters({ search: value }), 300);
  }

  // hlm-select's valueChange emits `T | null | undefined` since a selection can be
  // cleared, so these accept the wider type and normalize to a safe default.
  onPublishedFilterChange(value: PublishedFilter | null | undefined): void {
    const next = value ?? 'all';
    this.publishedFilter.set(next);
    const map: Record<PublishedFilter, boolean | undefined> = {
      all: undefined,
      published: true,
      unpublished: false,
    };
    this.state.setFilters({ isPublished: map[next] });
  }

  onFeaturedFilterChange(value: FeaturedFilter | null | undefined): void {
    const next = value ?? 'all';
    this.featuredFilter.set(next);
    const map: Record<FeaturedFilter, boolean | undefined> = {
      all: undefined,
      featured: true,
      unfeatured: false,
    };
    this.state.setFilters({ isFeatured: map[next] });
  }

  onLimitChange(value: number | null | undefined): void {
    this.state.setLimit(value ?? this.store.limit());
  }

  onAdd(): void {
    this.editing.set(null);
    this.isFormOpen.set(true);
  }

  onEdit(item: Category): void {
    this.editing.set(item);
    this.isFormOpen.set(true);
  }

  onCloseForm(): void {
    this.isFormOpen.set(false);
    this.editing.set(null);
  }

  openDelete(item: Category): void {
    this.toDelete.set(item);
    this.isDeleteOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteOpen.set(false);
    this.toDelete.set(null);
  }

  confirmDelete(): void {
    const id = this.toDelete()?.id;
    if (id) this.state.deleteCategory(id);
    this.cancelDelete();
  }

  onDrop(event: CdkDragDrop<Category[]>): void {
    const arr = [...this.categories()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.state.optimisticReorder(arr);
  }

  pageNumbers(): number[] {
    const total = this.store.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
