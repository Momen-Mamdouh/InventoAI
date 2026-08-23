import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucidePackage,
  lucideCircleX,
  lucideLock,
  lucideLogIn,
  lucideChevronLeft,
  lucideChevronRight,
  lucideShoppingBag,
  lucideSearch,
} from '@ng-icons/lucide';
import { OrdersHeroComponent, OrdersFilterBarComponent, OrderCardComponent } from '../../components';
import { OrdersDataService, ORDERS_SERVER_LOAD_LIMIT } from '@invento/user-site-data-access-order';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { ErrorState } from '@invento/shared-ui-error-state';
import { Pagination } from '@invento/shared-ui-pagination';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';

@Component({
  selector: 'app-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    HlmButtonImports,
    ...HlmTypographyImports,
    NgIconComponent,
    OrdersHeroComponent,
    OrdersFilterBarComponent,
    OrderCardComponent,
    EmptyState,
    ErrorState,
    SkeletonBlock,
    Pagination,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucidePackage,
      lucideCircleX,
      lucideLock,
      lucideLogIn,
      lucideChevronLeft,
      lucideChevronRight,
      lucideShoppingBag,
      lucideSearch,
    }),
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersComponent implements OnInit {
  protected readonly ordersService = inject(OrdersDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  ngOnInit(): void {
    // Generous limit: filtering/search/pagination below the fetch are all client-side (see
    // OrdersDataService.filteredOrders), so this one load has to cover the whole order history
    // a shopper might filter or search across.
    this.ordersService.loadOrders(this.storeSlug(), 1, ORDERS_SERVER_LOAD_LIMIT);
  }

  protected resetFilters(): void {
    this.ordersService.setFilter('all');
    this.ordersService.setSearchQuery('');
  }

  protected reload(): void {
    this.ordersService.loadOrders(this.storeSlug(), 1, ORDERS_SERVER_LOAD_LIMIT);
  }

  protected onPageChange(page: number): void {
    this.ordersService.setClientPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected goToLogin(): void {
    this.router.navigate(['/', this.storeSlug(), 'auth', 'login']);
  }
}
