import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideCheck,
  lucideFilter,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';
import { BrnPopoverContent } from '@spartan-ng/brain/popover';
import { HlmPopoverImports } from '@spartan/helm/popover';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { TranslatePipe } from '@invento/shared-util-i18n';

export type ColumnHeaderType = 'sort' | 'search' | 'filter' | 'none';
export type SortDirection = 'asc' | 'desc' | null | 'none';
export type TableColumnSortDirection = SortDirection;

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}
export type TableColumnFilterOption = FilterOption;

@Component({
  selector: 'app-table-header-cell',
  templateUrl: './table-header-cell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    BrnPopoverContent,
    HlmPopoverImports,
    HlmButton,
    HlmInput,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideArrowUpDown,
      lucideArrowUp,
      lucideArrowDown,
      lucideSearch,
      lucideFilter,
      lucideX,
      lucideCheck,
    }),
  ],
  host: {
    class: 'inline-block w-full',
  },
})
export class TableHeaderCell {
  public readonly type = input<ColumnHeaderType>('none');
  public readonly label = input.required<string>();
  public readonly align = input<'start' | 'center' | 'end'>('start');

  // Sort State
  public readonly sortDirection = input<SortDirection>(null);
  public readonly sortChange = output<SortDirection>();

  // Search State
  public readonly searchValue = input<string>('');
  public readonly searchPlaceholder = input<string>('');
  public readonly searchChange = output<string>();

  // Enum Filter State
  public readonly filterOptions = input<FilterOption[]>([]);
  public readonly selectedFilterValue = input<string>('');
  public readonly selectedFilter = input<string>('');
  public readonly filterChange = output<string>();

  protected readonly localSearch = signal<string>('');

  constructor() {
    effect(() => {
      this.localSearch.set(this.searchValue());
    });
  }

  protected readonly activeFilterValue = computed(
    () => this.selectedFilter() || this.selectedFilterValue(),
  );
  protected readonly isSortActive = computed(
    () => this.sortDirection() !== null && this.sortDirection() !== 'none',
  );
  protected readonly isSearchActive = computed(() => Boolean(this.searchValue().trim()));
  protected readonly isFilterActive = computed(() => Boolean(this.activeFilterValue()));

  protected readonly alignClass = computed(() => {
    switch (this.align()) {
      case 'end':
        return 'justify-end text-end';
      case 'center':
        return 'justify-center text-center';
      default:
        return 'justify-start text-start';
    }
  });

  protected onSortToggle(): void {
    const current = this.sortDirection();
    if (current === null) {
      this.sortChange.emit('asc');
    } else if (current === 'asc') {
      this.sortChange.emit('desc');
    } else {
      this.sortChange.emit(null);
    }
  }

  protected onApplySearch(): void {
    this.searchChange.emit(this.localSearch().trim());
  }

  protected onClearSearch(): void {
    this.localSearch.set('');
    this.searchChange.emit('');
  }

  protected onSelectFilter(value: string): void {
    this.filterChange.emit(value);
  }

  protected onClearFilter(): void {
    this.filterChange.emit('');
  }
}
