import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChildren,
} from '@angular/core';
import gsap from 'gsap';
import { FilterTabs, type FilterTab } from '@invento/shared-ui-filter-tabs';
import { SearchInput } from '@invento/shared-ui-search-input';
import { LocaleService, TranslatePipe } from '@invento/core';
import { OrdersDataService, type OrderFilter } from '@invento/user-site/app/features/orders';
import { animateElementsOnRender } from '@invento/user-site/app/core/utils/animation.utils';

const ORDER_FILTER_IDS: readonly OrderFilter[] = [
  'all',
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

@Component({
  selector: 'app-orders-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilterTabs, SearchInput, TranslatePipe],
  templateUrl: './orders-filter-bar.html',
})
export class OrdersFilterBarComponent {
  /**
   * This section used to carry the class `orders-hero-anim`, which belongs to `orders-hero`.
   * It was only ever animated as a side effect of that component's document-wide
   * `querySelectorAll`; once those queries were scoped to their own views, the entrance
   * silently stopped. It now owns its animation rather than borrowing a sibling's.
   */
  private readonly filterBar = viewChildren<ElementRef<HTMLElement>>('filterBar');

  protected readonly ordersService = inject(OrdersDataService);
  // Tab labels are data, not template text, so they are translated here rather than by the pipe.
  private readonly locale = inject(LocaleService);

  protected readonly tabs = computed<FilterTab<OrderFilter>[]>(() => {
    const counts = this.ordersService.statusCounts();
    this.locale.locale(); // re-compute labels when the language changes
    return ORDER_FILTER_IDS.map((id) => ({
      id,
      label: this.locale.translate(`orders.filters.${id}`),
      count: counts[id],
    }));
  });

  constructor() {
    animateElementsOnRender(this.filterBar, (targets) =>
      gsap.from(targets, { y: 25, opacity: 0, duration: 0.6, ease: 'power3.out' }),
    );
  }

  protected onFilterChange(filter: OrderFilter): void {
    this.ordersService.setFilter(filter);
  }

  protected onSearchChange(query: string): void {
    this.ordersService.setSearchQuery(query);
  }
}
