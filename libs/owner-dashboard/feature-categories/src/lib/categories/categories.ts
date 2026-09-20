import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideLoader2,
  lucideRefreshCw,
  lucideFolderOpen,
  lucideGripVertical,
  lucidePencil,
  lucideTrash2,
  lucideSearch,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCard } from '@spartan/helm/card';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import {
  HlmTable,
  HlmTableContainer,
  HlmTBody,
  HlmTd,
  HlmTh,
  HlmTHead,
  HlmTr,
} from '@spartan/helm/table';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmInput } from '@spartan/helm/input';
import { HlmAlert, HlmAlertDescription, HlmAlertTitle } from '@spartan/helm/alert';
import { HlmH1, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { HlmTooltip } from '@spartan/helm/tooltip';
import { CategoryFormDialog } from './category-form-dialog';
import { DeleteConfirmDialog } from '@invento/owner-dashboard-ui-confirm-dialog';
import { Category, CategoriesState } from '@invento/owner-dashboard-data-access-category';
import { Pagination } from '@invento/shared-ui-pagination';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';

type PublishedFilter = 'all' | 'published' | 'unpublished';
type FeaturedFilter = 'all' | 'featured' | 'unfeatured';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmCard,
    HlmSkeleton,
    HlmTable,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmTableContainer,
    HlmSelect,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmInput,
    HlmAlert,
    HlmAlertTitle,
    HlmAlertDescription,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CategoryFormDialog,
    DeleteConfirmDialog,
    HlmH1,
    HlmMuted,
    HlmSmall,
    HlmTooltip,
    Pagination,
    EmptyState,
    TranslatePipe,
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
  private readonly localeService = inject(LocaleService);

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

  readonly publishedItemToString = (value: PublishedFilter): string => {
    if (!value) {
      return '';
    }
    return this.localeService.translate(`categories.filter_status_${value}`);
  };

  readonly featuredItemToString = (value: FeaturedFilter): string => {
    if (!value) {
      return '';
    }
    return this.localeService.translate(`categories.filter_featured_${value}`);
  };

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
    if (id) {
      this.state.deleteCategory(id);
    }
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
