import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ProductApiService,
  SortOption,
  ProductListResponse,
  FilterResponse,
  ProductQueryParams,
  FiltersSidebar,
  ProductsToolbar,
  ProductsGrid,
  parseAttributes,
  stringifyAttributes,
} from '@invento/user-site/app/features/product';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmButtonImports } from '@spartan/helm/button';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { Pagination } from '@invento/shared-ui-pagination';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearchX, lucideInfo } from '@ng-icons/lucide';
import { switchMap, catchError, combineLatest, tap } from 'rxjs';
import { of, Subscription } from 'rxjs';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-products',
  templateUrl: './product.html',
  styleUrls: ['./product.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SkeletonBlock,
    FiltersSidebar,
    ProductsToolbar,
    ProductsGrid,
    Pagination,
    HlmTypographyImports,
    HlmButtonImports,
    EmptyState,
    NgIcon,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideSearchX, lucideInfo })],
})
export class Products implements OnInit, OnDestroy {
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  private readonly apiService = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // State
  public readonly isLoading = signal<boolean>(true);
  public readonly productsResponse = signal<ProductListResponse | null>(null);
  public readonly filterResponse = signal<FilterResponse | null>(null);

  // Computed properties for the UI
  public readonly currentSort = signal<SortOption>('relevance');

  public readonly didYouMean = computed(() => this.productsResponse()?.didYouMean ?? null);
  public readonly searchMode = computed(() => this.productsResponse()?.searchMode ?? null);

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.queryParams
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap((params) => {
          const queryParams: ProductQueryParams = {
            page: params['page'] ? Number(params['page']) : 1,
            limit: params['limit'] ? Number(params['limit']) : 6,
            search: params['search'] || undefined,
            category: params['category'] || undefined,
            minPrice: params['minPrice'] ? Number(params['minPrice']) : undefined,
            maxPrice: params['maxPrice'] ? Number(params['maxPrice']) : undefined,
            inStock: params['inStock'] === 'true',
            attributes: params['attributes'] || undefined,
            sort: (params['sort'] as SortOption) || 'relevance',
          };

          this.currentSort.set(queryParams.sort || 'relevance');

          return combineLatest([
            this.apiService
              .getProducts(this.storeSlug(), queryParams)
              .pipe(catchError(() => of(null))),
            this.apiService
              .getFilters(this.storeSlug(), queryParams)
              .pipe(catchError(() => of(null))),
          ]);
        }),
      )
      .subscribe(([products, filters]) => {
        this.productsResponse.set(products);
        this.filterResponse.set(filters);
        this.isLoading.set(false);
      });
  }

  // --- Handlers that update URL --- //
  private updateUrl(updates: Record<string, unknown>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: updates,
      queryParamsHandling: 'merge',
    });
  }

  protected onSortChange(sort: SortOption): void {
    this.updateUrl({ sort, page: 1 });
  }

  protected onSearchSubmit(search: string): void {
    this.updateUrl({ search: search || null, page: 1 });
  }

  protected onPageChange(page: number): void {
    this.updateUrl({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onCategoryChange(categorySlug: string): void {
    this.updateUrl({ category: categorySlug, page: 1 });
  }

  protected onPriceChange(range: { min?: number; max?: number }): void {
    this.updateUrl({ minPrice: range.min, maxPrice: range.max, page: 1 });
  }

  protected onInStockChange(inStock: boolean): void {
    this.updateUrl({ inStock: inStock ? 'true' : null, page: 1 });
  }

  protected onAttributeChange(event: { key: string; values: string[] }): void {
    const currentParams = this.route.snapshot.queryParams;
    const attrs = parseAttributes(currentParams['attributes']);

    if (event.values.length > 0) {
      attrs[event.key] = event.values;
    } else {
      delete attrs[event.key];
    }

    const attributesString = stringifyAttributes(attrs);
    this.updateUrl({ attributes: attributesString || null, page: 1 });
  }

  protected onClearAll(): void {
    // Clear everything except maybe category if we're on a category page, but for now clear all filters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
