import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FiltersSidebar, ProductsToolbar, ProductsGrid } from '../../components';
import { parseAttributes, stringifyAttributes } from '../../utils';
import {
  ProductApiService,
  SortOption,
  ProductListResponse,
  FilterResponse,
  ProductQueryParams,
  FilterCategory,
} from '@invento/user-site-data-access-product';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { Pagination } from '@invento/shared-ui-pagination';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearchX,
  lucideInfo,
  lucideFilter,
  lucideX,
  lucideChevronRight,
  lucideRotateCcw,
  lucideSparkles,
  lucideFilterX,
  lucidePackageOpen,
  lucideArrowLeft,
} from '@ng-icons/lucide';
import { switchMap, catchError, combineLatest, tap } from 'rxjs';
import { of, Subscription } from 'rxjs';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';

export interface ActiveFilterChip {
  id: string;
  label: string;
  remove: () => void;
}

@Component({
  selector: 'app-products',
  templateUrl: './product.html',
  styleUrls: ['./product.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SkeletonBlock,
    FiltersSidebar,
    ProductsToolbar,
    ProductsGrid,
    Pagination,
    HlmTypographyImports,
    HlmButtonImports,
    HlmBadge,
    HlmSheetImports,
    NgIcon,
    TranslatePipe,
  ],
  providers: [
    CurrencyPipe,
    provideIcons({
      lucideSearchX,
      lucideInfo,
      lucideFilter,
      lucideX,
      lucideChevronRight,
      lucideRotateCcw,
      lucideSparkles,
      lucideFilterX,
      lucidePackageOpen,
      lucideArrowLeft,
    }),
  ],
})
export class Products implements OnInit, OnDestroy {
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  private readonly apiService = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);
  private readonly currencyPipe = inject(CurrencyPipe);

  // State
  public readonly isLoading = signal<boolean>(true);
  public readonly productsResponse = signal<ProductListResponse | null>(null);
  public readonly filterResponse = signal<FilterResponse | null>(null);
  public readonly density = signal<'comfortable' | 'compact'>('comfortable');
  public readonly isMobileFilterOpen = signal<boolean>(false);
  public readonly currentParams = signal<Record<string, string>>({});

  // Computed properties for the UI
  public readonly currentSort = signal<SortOption>('relevance');

  public readonly didYouMean = computed(() => this.productsResponse()?.didYouMean ?? null);
  public readonly searchMode = computed(() => this.productsResponse()?.searchMode ?? null);

  public readonly selectedCategorySlug = computed(
    () => this.currentParams()['category'] || null,
  );

  public readonly activeCategory = computed<FilterCategory | null>(() => {
    const slug = this.selectedCategorySlug();
    if (!slug) {
      return null;
    }
    return this.filterResponse()?.categories?.find((c) => c.slug === slug) ?? null;
  });

  public readonly activeCategoryName = computed(
    () => this.activeCategory()?.name ?? null,
  );

  public readonly categories = computed(
    () => this.filterResponse()?.categories ?? [],
  );

  public readonly searchQuery = computed(
    () => this.currentParams()['search'] || '',
  );

  public readonly activeChips = computed<ActiveFilterChip[]>(() => {
    const params = this.currentParams();
    const chips: ActiveFilterChip[] = [];
    const filters = this.filterResponse();

    // 1. Search query
    if (params['search']) {
      chips.push({
        id: 'search',
        label: this.localeService.translate('product.chips.search', {
          query: params['search'],
        }),
        remove: () => this.onSearchSubmit(''),
      });
    }

    // 2. Category
    if (params['category']) {
      const catName = this.activeCategoryName() || params['category'];
      chips.push({
        id: 'category',
        label: this.localeService.translate('product.chips.category', {
          name: catName,
        }),
        remove: () => this.onCategoryChange(''),
      });
    }

    // 3. Price under max
    if (params['maxPrice']) {
      const maxFormatted = this.currencyPipe.transform(Number(params['maxPrice']));
      chips.push({
        id: 'price',
        label: this.localeService.translate('product.chips.price_under', {
          price: maxFormatted || params['maxPrice'],
        }),
        remove: () => this.onPriceChange({}),
      });
    }

    // 4. In stock only
    if (params['inStock'] === 'true') {
      chips.push({
        id: 'inStock',
        label: this.localeService.translate('product.chips.in_stock'),
        remove: () => this.onInStockChange(false),
      });
    }

    // 5. Attributes
    if (params['attributes']) {
      const attrs = parseAttributes(params['attributes']);
      Object.entries(attrs).forEach(([key, values]) => {
        const facet = filters?.attributes?.find((a) => a.key === key);
        const facetName = facet?.name || key;
        values.forEach((val) => {
          const valObj = facet?.values.find((v) => v.slug === val);
          const valLabel = valObj?.value || val;
          chips.push({
            id: `attr-${key}-${val}`,
            label: this.localeService.translate('product.chips.attr', {
              key: facetName,
              value: valLabel,
            }),
            remove: () => this.removeAttributeValue(key, val),
          });
        });
      });
    }

    return chips;
  });

  public readonly activeFilterCount = computed(() => this.activeChips().length);
  public readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0);

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.queryParams
      .pipe(
        tap((params) => {
          this.isLoading.set(true);
          this.currentParams.set(params as Record<string, string>);
        }),
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
    this.updateUrl({ category: categorySlug || null, page: 1 });
  }

  protected onPriceChange(range: { min?: number; max?: number }): void {
    this.updateUrl({ minPrice: range.min || null, maxPrice: range.max || null, page: 1 });
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

  protected removeAttributeValue(key: string, value: string): void {
    const currentParams = this.route.snapshot.queryParams;
    const attrs = parseAttributes(currentParams['attributes']);
    if (attrs[key]) {
      attrs[key] = attrs[key].filter((v) => v !== value);
      if (attrs[key].length === 0) {
        delete attrs[key];
      }
      const attributesString = stringifyAttributes(attrs);
      this.updateUrl({ attributes: attributesString || null, page: 1 });
    }
  }

  protected onMobileFilterStateChanged(state: 'open' | 'closed'): void {
    this.isMobileFilterOpen.set(state === 'open');
  }

  protected onClearAll(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
