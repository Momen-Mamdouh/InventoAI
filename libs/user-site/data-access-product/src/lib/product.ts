export type SearchMode = 'exact' | 'fuzzy' | null;

export interface ProductSuggestion {
  readonly title: string;
  readonly slug: string;
  readonly imageUrl: string | null;
  readonly minPriceAmount: number;
}

export interface CategoryDto {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly productCount: number | null;
}

export interface SwatchDto {
  readonly attributeKey: string;
  readonly attributeName: string;
  readonly value: string;
  readonly slug: string;
  readonly swatchHex: string | null; // Product spec/option swatchHex is string | null, but listing swatchHex is string. Let's make it string | null.
}

export interface ProductListItem {
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly imageUrl: string | null;
  readonly imageAltText: string | null;
  readonly categories: readonly CategoryDto[];
  readonly minPriceAmount: number;
  readonly maxPriceAmount: number;
  readonly inStock: boolean;
  readonly swatches: readonly SwatchDto[];
}

export interface ProductListResponse {
  readonly items: ProductListItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly searchMode: SearchMode;
  readonly didYouMean: string | null;
}

export interface ProductSpecValue {
  readonly value: string;
  readonly slug: string;
  readonly swatchHex: string | null;
}

export interface ProductSpec {
  readonly key: string;
  readonly name: string;
  readonly displayStyle: string; // swatch, chip, list, dropdown
  readonly values: readonly ProductSpecValue[];
}

export interface ProductVariantOption {
  readonly attributeKey: string;
  readonly attributeName: string;
  readonly value: string;
  readonly slug: string;
  readonly swatchHex: string | null;
}

export interface ProductVariant {
  readonly id: string;
  readonly priceAmount: number;
  readonly compareAtAmount: number | null;
  readonly inStock: boolean;
  readonly stockLeft: number | null;
  readonly options: readonly ProductVariantOption[];
}

export interface ProductDetail {
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly images: readonly { url: string; altText: string | null }[];
  readonly categories: readonly CategoryDto[];
  readonly specs: readonly ProductSpec[];
  readonly variants: readonly ProductVariant[];
  readonly minPriceAmount: number;
  readonly maxPriceAmount: number;
  readonly variantCount: number;
  readonly inStock: boolean;
}

export interface FilterPriceRange {
  readonly min: number;
  readonly max: number;
}

export interface FilterCategory {
  readonly slug: string;
  readonly name: string;
  readonly count: number;
}

export interface FilterAttributeValue {
  readonly slug: string;
  readonly value: string;
  readonly swatchHex: string | null;
  readonly count: number;
}

export interface FilterAttribute {
  readonly key: string;
  readonly name: string;
  readonly displayStyle: string; // swatch, chip, list, dropdown
  readonly isVariantAxis: boolean;
  readonly values: readonly FilterAttributeValue[];
}

export interface FilterResponse {
  readonly price: FilterPriceRange;
  readonly categories: readonly FilterCategory[];
  readonly attributes: readonly FilterAttribute[];
}

export type SortOption = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'title';

// Query params payload for listing & filters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  attributes?: string; // e.g. size:xl,l;color:black
  sort?: SortOption;
}
