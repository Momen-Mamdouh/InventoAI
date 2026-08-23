export enum AttributeDisplayStyle {
  List = 'list',
  Dropdown = 'dropdown',
  Swatch = 'swatch',
}

export interface ProductAttributeValue {
  id: string;
  value: string;
  slug: string;
  swatchHex: string | null;
  position: number;
}

export interface ProductAttribute {
  id: string;
  name: string;
  key: string;
  isVariantAxis: boolean;
  isFilterable: boolean;
  showOnProductPage: boolean;
  displayStyle: string;
  position: number;
  values: ProductAttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductAttributeDto {
  name: string;
  key?: string;
  isVariantAxis: boolean;
  isFilterable: boolean;
  showOnProductPage: boolean;
  displayStyle: string;
}

export interface UpdateProductAttributeDto {
  name?: string;
  key?: string;
  isFilterable?: boolean;
  showOnProductPage?: boolean;
  displayStyle?: string;
}

export interface ReorderItemDto {
  id: string;
  position: number;
}

export interface ReorderDto {
  items: ReorderItemDto[];
}

export interface AddAttributeValueDto {
  value: string;
  slug?: string;
  swatchHex?: string | null;
}

export interface UpdateAttributeValueDto {
  value?: string;
  slug?: string;
  swatchHex?: string | null;
}
