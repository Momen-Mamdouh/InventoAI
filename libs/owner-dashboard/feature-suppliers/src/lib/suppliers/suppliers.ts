import { Router } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
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
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmInput } from '@spartan/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmAlert, HlmAlertDescription, HlmAlertTitle } from '@spartan/helm/alert';
import {
  HlmTable,
  HlmTHead,
  HlmTBody,
  HlmTr,
  HlmTh,
  HlmTd,
} from '@spartan/helm/table';
import { HlmSheet, HlmSheetContent, HlmSheetPortal } from '@spartan/helm/sheet';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { DeleteConfirmDialog } from '@invento/owner-dashboard-ui-confirm-dialog';
import { Supplier, SuppliersState } from '@invento/owner-dashboard-data-access-supplier';
import { Pagination } from '@invento/shared-ui-pagination';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { TableHeaderCell, SortDirection, FilterOption } from '@invento/shared-ui-table-header';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { SupplierForm } from './supplier-form';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    DatePipe,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmSkeleton,
    HlmInput,
    HlmSelect,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmAlert,
    HlmAlertTitle,
    HlmAlertDescription,
    HlmTable,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmSheet,
    HlmSheetContent,
    HlmSheetPortal,
    HlmH1,
    HlmMuted,
    Pagination,
    EmptyState,
    TableHeaderCell,
    DeleteConfirmDialog,
    SupplierForm,
    TranslatePipe,
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
  private readonly localeService = inject(LocaleService);

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

  // Column Header Sort, Search & Filter
  readonly colSearchName = signal<string>('');
  readonly colSearchPhone = signal<string>('');
  readonly sortColumn = signal<'leadTime' | 'date' | null>(null);
  readonly sortDirection = signal<SortDirection>(null);
  readonly colFilterStatus = signal<string>('');

  readonly statusFilterOptions: FilterOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  readonly displayedSuppliers = computed(() => {
    let list = [...this.suppliers()];

    // Column search: Name
    const nameQ = this.colSearchName().trim().toLowerCase();
    if (nameQ) {
      list = list.filter((s) => s.name.toLowerCase().includes(nameQ));
    }

    // Column search: Phone/Email
    const phoneQ = this.colSearchPhone().trim().toLowerCase();
    if (phoneQ) {
      list = list.filter(
        (s) =>
          (s.phone && s.phone.toLowerCase().includes(phoneQ)) ||
          (s.contactEmail && s.contactEmail.toLowerCase().includes(phoneQ)),
      );
    }

    // Column filter: Status
    const statusF = this.colFilterStatus();
    if (statusF) {
      const isActive = statusF === 'active';
      list = list.filter((s) => s.isActive === isActive);
    }

    // Column sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col && dir) {
      list.sort((a, b) => {
        let diff = 0;
        if (col === 'leadTime') {
          diff = (a.leadTimeDays ?? 0) - (b.leadTimeDays ?? 0);
        } else if (col === 'date') {
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return dir === 'asc' ? diff : -diff;
      });
    }

    return list;
  });

  onSortChange(col: 'leadTime' | 'date', dir: SortDirection): void {
    this.sortColumn.set(dir ? col : null);
    this.sortDirection.set(dir);
  }

  onNameSearchChange(q: string): void {
    this.colSearchName.set(q);
  }

  onPhoneSearchChange(q: string): void {
    this.colSearchPhone.set(q);
  }

  onStatusFilterChange(val: string): void {
    this.colFilterStatus.set(val);
  }

  protected readonly sheetSide = computed<'left' | 'right'>(() =>
    this.localeService.isRtl() ? 'left' : 'right',
  );

  readonly activeItemToString = (value: unknown): string => {
    const str = String(value);
    const key = `suppliers.filter_${str.toLowerCase()}`;
    const translated = this.localeService.translate(key);
    return translated && translated !== key ? translated : str;
  };

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
    this.searchDebounce = setTimeout(() => {
      this.state.setFilters({ search: value });
    }, 300);
  }

  onResetFilters(): void {
    this.searchTerm.set('');
    this.activeFilter.set('all');
    this.state.setFilters({ search: '', isActive: undefined });
  }

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

  onDrawerStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.onCloseForm();
    }
  }

  onFormSaved(): void {
    this.onCloseForm();
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
    const item = this.toDelete();
    if (item) {
      this.state.deleteSupplier(item.id);
    }
    this.cancelDelete();
  }

  pageNumbers(): number[] {
    const total = this.store.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
