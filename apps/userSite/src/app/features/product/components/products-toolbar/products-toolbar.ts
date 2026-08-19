import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnDestroy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  SortOption,
  ProductSuggestion,
} from '@invento/user-site/app/features/product/types/product';
import { HlmBadge } from '@spartan/helm/badge';
import { Subscription } from 'rxjs';
import { debounceTime, filter, switchMap, tap, distinctUntilChanged, delay } from 'rxjs/operators';
import { ProductApiService } from '@invento/user-site/app/features/product';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmInputImports } from '@spartan/helm/input';
import {
  GenericSelectImports,
  GenericSelectOption,
  SearchInput,
  SkeletonBlock,
} from '@invento/shared';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideSearchX } from '@ng-icons/lucide';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmButton } from '@spartan/helm/button';

import { TranslatePipe, LocaleService } from '@invento/core';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-products-toolbar',
  templateUrl: './products-toolbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SkeletonBlock,
    HlmBadge,
    CurrencyPipe,
    ReactiveFormsModule,
    HlmInputImports,
    GenericSelectImports,
    SearchInput,
    NgIcon,
    HlmTypographyImports,
    HlmButton,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideInfo, lucideSearchX })],
})
export class ProductsToolbar implements OnInit, OnDestroy {
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  public readonly title = input<string>('Products');
  public readonly count = input<number>(0);
  public readonly sort = input<SortOption>('relevance');

  private readonly localeService = inject(LocaleService);

  get sortOptions(): GenericSelectOption[] {
    return [
      { label: this.localeService.translate('product.toolbar.sort_relevance'), value: 'relevance' },
      { label: this.localeService.translate('product.toolbar.sort_newest'), value: 'newest' },
      { label: this.localeService.translate('product.toolbar.sort_price_asc'), value: 'price_asc' },
      {
        label: this.localeService.translate('product.toolbar.sort_price_desc'),
        value: 'price_desc',
      },
      { label: this.localeService.translate('product.toolbar.sort_title_asc'), value: 'title' },
    ];
  }

  public readonly sortChange = output<SortOption>();
  public readonly searchSubmit = output<string>();

  private readonly apiService = inject(ProductApiService);
  private readonly router = inject(Router);

  public searchControl = new FormControl('', [Validators.minLength(2)]);
  private sub?: Subscription;

  public readonly searchTerm = signal<string>('');
  public readonly suggestions = signal<ProductSuggestion[]>([]);
  public readonly showSuggestions = signal<boolean>(false);
  public readonly isLoadingSuggestions = signal<boolean>(false);

  ngOnInit(): void {
    this.sub = this.searchControl.valueChanges
      .pipe(
        tap((term) => {
          const safeTerm = term || '';
          this.searchTerm.set(safeTerm);

          if (safeTerm.length > 0) {
            this.showSuggestions.set(true);
          } else {
            this.showSuggestions.set(false);
          }

          if (safeTerm.length < 2) {
            this.suggestions.set([]);
            this.isLoadingSuggestions.set(false);
          }
        }),
        filter((term) => (term || '').length >= 2 && this.searchControl.valid),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.isLoadingSuggestions.set(true)),
        switchMap((term) =>
          this.apiService.getProductSuggestions(this.storeSlug(), term!).pipe(delay(1000)),
        ),
      )
      .subscribe({
        next: (results) => {
          this.suggestions.set(results);
          this.isLoadingSuggestions.set(false);
        },
        error: () => {
          this.suggestions.set([]);
          this.isLoadingSuggestions.set(false);
        },
      });
  }

  protected onSortChange(value: unknown): void {
    if (value) {
      this.sortChange.emit(value as SortOption);
    }
  }

  protected onSearchEnter(): void {
    if (this.searchControl.valid) {
      const value = this.searchControl.value?.trim() || '';
      this.showSuggestions.set(false);
      this.searchSubmit.emit(value);
    }
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
    this.showSuggestions.set(false);
    this.searchSubmit.emit('');
  }

  protected onSuggestionClick(suggestion: ProductSuggestion): void {
    this.showSuggestions.set(false);
    this.router.navigate(['/', this.storeSlug(), 'product-details', suggestion.slug]);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
