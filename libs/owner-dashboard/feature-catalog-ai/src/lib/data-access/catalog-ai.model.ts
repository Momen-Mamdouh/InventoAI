export interface CatalogGenerationRequest {
  instructions?: string;
}

export interface GeneratedCategory {
  name: string;
  description: string | null;
}

export interface GeneratedAttributeValue {
  value: string;
  swatchHex: string | null;
}

export interface GeneratedAttribute {
  name: string;
  key: string;
  isVariantAxis: boolean;
  displayStyle: 'swatch' | 'chip' | 'list' | 'dropdown';
  values: GeneratedAttributeValue[];
}

export interface CatalogGenerationResponse {
  categories: GeneratedCategory[];
  attributes: GeneratedAttribute[];
}

export interface ApplyCategory {
  name: string;
  slug?: string;
  description?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface ApplyAttributeValue {
  value: string;
  slug?: string;
  swatchHex?: string;
}

export interface ApplyAttribute {
  name: string;
  key?: string;
  isVariantAxis?: boolean;
  isFilterable?: boolean;
  showOnProductPage?: boolean;
  displayStyle?: 'swatch' | 'chip' | 'list' | 'dropdown';
  values: ApplyAttributeValue[];
}

export interface CatalogApplyRequest {
  categories?: ApplyCategory[];
  attributes?: ApplyAttribute[];
}

export interface CatalogApplyResponse {
  categoriesCreated: number;
  categoriesSkipped: number;
  attributesCreated: number;
  attributesSkipped: number;
  skipped: string[];
}
