import { Injectable, computed, signal } from '@angular/core';
import type { ProductDetail, ProductVariant, ProductVariantOption } from '../types';

@Injectable()
export class ProductStore {
  private readonly _product = signal<ProductDetail | null>(null);
  private readonly _selectedOptions = signal<Record<string, string>>({});
  private readonly _quantity = signal(1);
  readonly product = this._product.asReadonly();
  readonly quantity = this._quantity.asReadonly();
  readonly selectedOptions = this._selectedOptions.asReadonly();

  // Extract all unique axes (e.g. Size, Color) from all variants
  readonly variantAxes = computed(() => {
    const p = this._product();
    if (!p || !p.variants) return [];

    const axesMap = new Map<
      string,
      { key: string; name: string; options: ProductVariantOption[] }
    >();

    for (const variant of p.variants) {
      for (const opt of variant.options) {
        if (!axesMap.has(opt.attributeKey)) {
          axesMap.set(opt.attributeKey, {
            key: opt.attributeKey,
            name: opt.attributeName,
            options: [],
          });
        }

        const axis = axesMap.get(opt.attributeKey)!;
        if (!axis.options.find((o) => o.slug === opt.slug)) {
          axis.options.push(opt);
        }
      }
    }

    return Array.from(axesMap.values());
  });

  private variantMatchesSelection(
    variant: ProductVariant,
    selection: Record<string, string>,
  ): boolean {
    return Object.entries(selection).every(([key, slug]) => {
      return variant.options.some((vo) => vo.attributeKey === key && vo.slug === slug);
    });
  }

  // Determines which options are currently valid based on OTHER selected axes
  readonly availableOptionSlugs = computed(() => {
    const p = this._product();
    if (!p) return new Set<string>();

    const selected = this._selectedOptions();
    const validSlugs = new Set<string>();

    for (const axis of this.variantAxes()) {
      for (const opt of axis.options) {
        // Create a test selection where we pretend to select this option
        const testSelection = { ...selected, [axis.key]: opt.slug };

        // Is there any variant that satisfies this test selection?
        const isValid = p.variants.some((variant) =>
          this.variantMatchesSelection(variant, testSelection),
        );

        if (isValid) {
          // Format: attributeKey:slug to ensure uniqueness across axes
          validSlugs.add(`${axis.key}:${opt.slug}`);
        }
      }
    }

    return validSlugs;
  });

  readonly currentVariant = computed<ProductVariant | undefined>(() => {
    const p = this._product();
    if (!p) return undefined;

    const selected = this._selectedOptions();
    const axesKeys = this.variantAxes().map((a) => a.key);

    // Need to have all axes selected
    if (Object.keys(selected).length !== axesKeys.length) return undefined;

    return p.variants.find((variant) => this.variantMatchesSelection(variant, selected));
  });

  readonly lineTotal = computed(() => {
    const variant = this.currentVariant();
    if (variant) return variant.priceAmount * this._quantity();
    return (this._product()?.minPriceAmount ?? 0) * this._quantity();
  });

  readonly canAddToCart = computed(() => {
    const variant = this.currentVariant();
    return !!variant && variant.inStock;
  });

  loadProduct(product: ProductDetail): void {
    this._product.set(product);

    // Auto-select first available options
    const initialSelection: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      // Find first in-stock variant if possible, else just first
      const defaultVariant = product.variants.find((v) => v.inStock) || product.variants[0];
      for (const opt of defaultVariant.options) {
        initialSelection[opt.attributeKey] = opt.slug;
      }
    }

    this._selectedOptions.set(initialSelection);
    this._quantity.set(1);
  }

  selectOption(attributeKey: string, slug: string): void {
    const current = { ...this._selectedOptions() };
    current[attributeKey] = slug;

    // Check if the new selection makes current variant invalid. If so, attempt to correct.
    // E.g., if you switch from Large to Small, but Red isn't available in Small.
    const p = this._product();
    if (p) {
      const isValid = p.variants.some((variant) => this.variantMatchesSelection(variant, current));

      if (!isValid) {
        // Fallback: pick the first variant that matches the newly selected option
        const fallbackVariant = p.variants.find((variant) => {
          return variant.options.some((vo) => vo.attributeKey === attributeKey && vo.slug === slug);
        });

        if (fallbackVariant) {
          for (const opt of fallbackVariant.options) {
            current[opt.attributeKey] = opt.slug;
          }
        }
      }
    }

    this._selectedOptions.set(current);
  }

  increment(): void {
    this._quantity.update((q) => q + 1);
  }

  decrement(): void {
    this._quantity.update((q) => Math.max(1, q - 1));
  }
}
