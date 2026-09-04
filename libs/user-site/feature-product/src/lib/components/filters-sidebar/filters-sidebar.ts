import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HlmButton } from '@spartan/helm/button';
import { FilterResponse, FilterAttribute } from '@invento/user-site-data-access-product';
import { ActivatedRoute } from '@angular/router';
import { parseAttributes } from '../../utils';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { GenericSelectImports, GenericSelectOption } from '@invento/shared-ui-generic-select';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { HlmCheckboxImports } from '@spartan/helm/checkbox';
import { HlmSwitchImports } from '@spartan/helm/switch';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw, lucideFilterX } from '@ng-icons/lucide';
import { ColorSwatch } from '@invento/shared-ui-color-swatch';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { HlmSlider } from '@spartan/helm/slider';

import { HlmAccordionImports } from '@spartan/helm/accordion';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-filters-sidebar',
  templateUrl: './filters-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SkeletonBlock,
    CurrencyPipe,
    HlmButton,
    HlmTypographyImports,
    GenericSelectImports,
    HlmCheckboxImports,
    HlmSwitchImports,
    NgIcon,
    ColorSwatch,
    HlmSlider,
    EmptyState,
    HlmAccordionImports,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideRotateCcw, lucideFilterX })],
})
export class FiltersSidebar {
  private readonly localeService = inject(LocaleService);
  public readonly filters = input<FilterResponse | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly categoryChange = output<string>();
  public readonly priceChange = output<{ min?: number; max?: number }>();
  public readonly inStockChange = output<boolean>();
  public readonly attributeChange = output<{ key: string; values: string[] }>();
  public readonly clearAll = output<void>();

  private readonly route = inject(ActivatedRoute);

  // Helper getters to check current active states from URL
  get activeCategory(): string | null {
    return this.route.snapshot.queryParams['category'] || null;
  }

  get hasActiveFilters(): boolean {
    const qp = this.route.snapshot.queryParams;
    return !!(
      qp['category'] ||
      qp['minPrice'] ||
      qp['maxPrice'] ||
      qp['inStock'] ||
      qp['attributes'] ||
      qp['search']
    );
  }

  get currentMinPrice(): number {
    const val = this.route.snapshot.queryParams['minPrice'];
    return val ? Number(val) : this.filters()?.price?.min || 0;
  }

  get currentMaxPrice(): number {
    const val = this.route.snapshot.queryParams['maxPrice'];
    return val ? Number(val) : this.filters()?.price?.max || 5000; // 5000 is fallback
  }

  get isInStockOnly(): boolean {
    return this.route.snapshot.queryParams['inStock'] === 'true';
  }

  isAttributeSelected(key: string, value: string): boolean {
    const attrs = parseAttributes(this.route.snapshot.queryParams['attributes']);
    return attrs[key]?.includes(value) || false;
  }

  protected onCategoryClick(slug: string): void {
    // Toggle logic: if already selected, deselect
    if (this.activeCategory === slug) {
      this.categoryChange.emit('');
    } else {
      this.categoryChange.emit(slug);
    }
  }

  protected onPriceSliderChange(values: number[]): void {
    if (values && values.length > 0) {
      this.priceChange.emit({ max: values[0] });
    }
  }

  protected onAttributeToggle(key: string, value: string): void {
    const attrs = parseAttributes(this.route.snapshot.queryParams['attributes']);
    let currentValues = attrs[key] || [];

    if (currentValues.includes(value)) {
      currentValues = currentValues.filter((v) => v !== value);
    } else {
      currentValues = [...currentValues, value];
    }

    this.attributeChange.emit({ key, values: currentValues });
  }

  protected onDropdownChange(key: string, value: string): void {
    if (value === '__all__') {
      this.attributeChange.emit({ key, values: [] });
    } else {
      this.attributeChange.emit({ key, values: [value] });
    }
  }

  getSelectOptions(attr: FilterAttribute): GenericSelectOption[] {
    const opts = attr.values.map((v) => ({
      label: v.value,
      value: v.slug,
      disabled: v.count === 0,
      suffix: v.count === 0 ? '0' : String(v.count),
    }));
    return [
      {
        label: this.localeService.translate('product.filters.all', { name: attr.name }),
        value: '',
      },
      ...opts,
    ];
  }

  getSingleSelectedValue(key: string): string | null {
    const attrs = parseAttributes(this.route.snapshot.queryParams['attributes']);
    return attrs[key]?.[0] || null;
  }
}
