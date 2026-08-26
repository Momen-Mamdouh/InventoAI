import { Router } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideMail,
  lucidePhone,
  lucideTruck,
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucideSearch,
  lucideRefreshCw,
  lucideChevronRight,
  lucideTriangleAlert,
  lucideNotebookText,
  lucideUsers,
  lucideCircleCheck,
  lucideCircleX,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmSkeletonImports } from '@spartan/helm/skeleton';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmAlertImports } from '@spartan/helm/alert';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { SupplierFormDialog } from './supplier-form-dialog';
import { DeleteConfirmDialog } from '@invento/owner-dashboard-ui-confirm-dialog';
import { Supplier, SuppliersState } from '@invento/owner-dashboard-data-access-supplier';
import { Pagination } from '@invento/shared-ui-pagination';
import { EmptyState } from '@invento/shared-ui-empty-state';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    DatePipe,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmSkeletonImports,
    HlmInputImports,
    HlmSelectImports,
    HlmAlertImports,
    SupplierFormDialog,
    DeleteConfirmDialog,
    HlmTableImports,
    HlmH1,
    HlmMuted,
    Pagination,
    EmptyState,
  ],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucideMail,
      lucidePhone,
      lucideTruck,
      lucidePlus,
      lucidePencil,
      lucideTrash2,
      lucideSearch,
      lucideRefreshCw,
      lucideChevronRight,
      lucideTriangleAlert,
      lucideNotebookText,
      lucideUsers,
      lucideCircleCheck,
      lucideCircleX,
    }),
  ],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Suppliers implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly state = inject(SuppliersState);

  readonly suppliers = this.state.suppliers;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly store = this.state;

  readonly isFormOpen = signal(false);
  readonly editing = signal<Supplier | null>(null);
  readonly isDeleteOpen = signal(false);
  readonly toDelete = signal<Supplier | null>(null);

  readonly searchTerm = signal('');
  readonly activeFilter = signal<ActiveFilter>('all');

  private readonly activeFilterLabels: Record<ActiveFilter, string> = {
    all: 'All suppliers',
    active: 'Active only',
    inactive: 'Inactive only',
  };

  // hlm-select-value shows the raw bound value unless the select is given an
  // itemToString mapper — without this it would literally render "all"/"active"/etc.
  readonly activeItemToString = (value: ActiveFilter): string =>
    this.activeFilterLabels[value] ?? '';

  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.state.loadSuppliers();
    this.state.loadKpis();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchDebounce);
  }

  onRefresh(): void {
    this.state.loadSuppliers();
    this.state.loadKpis();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.state.setFilters({ search: value }), 300);
  }

  // hlm-select's valueChange emits `T | null | undefined` since a selection can be
  // cleared, so this accepts the wider type and normalizes to a safe default.
  onActiveFilterChange(value: ActiveFilter | null | undefined): void {
    const next = value ?? 'all';
    this.activeFilter.set(next);
    const map: Record<ActiveFilter, boolean | undefined> = {
      all: undefined,
      active: true,
      inactive: false,
    };
    this.state.setFilters({ isActive: map[next] });
  }

  onLimitChange(value: number | null | undefined): void {
    this.state.setLimit(value ?? this.store.limit());
  }

  onAdd(): void {
    this.editing.set(null);
    this.isFormOpen.set(true);
  }

  onView(item: Supplier): void {
    this.router.navigate(['/suppliers', item.id]);
  }

  onEdit(item: Supplier): void {
    this.editing.set(item);
    this.isFormOpen.set(true);
  }

  onCloseForm(): void {
    this.isFormOpen.set(false);
    this.editing.set(null);
  }

  onToggleActive(item: Supplier): void {
    this.state.toggleActive(item);
  }

  openDelete(item: Supplier): void {
    this.toDelete.set(item);
    this.isDeleteOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteOpen.set(false);
    this.toDelete.set(null);
  }

  confirmDelete(): void {
    const id = this.toDelete()?.id;
    if (id) this.state.deleteSupplier(id);
    this.cancelDelete();
  }

  pageNumbers(): number[] {
    const total = this.store.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
