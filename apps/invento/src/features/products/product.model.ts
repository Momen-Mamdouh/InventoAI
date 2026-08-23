export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProductListItem {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'active' | 'archived';
  isFeatured: boolean;
  position: number;
  minPriceAmount: number;
  maxPriceAmount: number;
  totalStock: number;
  variantCount: number;
  imageUrl: string | null;
  categories: ApiCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiAttributeValue {
  id: string;
  attributeId: string;
  attributeKey: string;
  attributeName: string;
  value: string;
  slug: string;
  swatchHex: string | null;
}

export interface ApiProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface ApiProductVariant {
  id: string;
  sku: string;
  priceAmount: number;
  compareAtAmount: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isDefault: boolean;
  position: number;
  attributeValues: ApiAttributeValue[];
}

export interface ApiProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  searchKeywords: string;
  status: 'draft' | 'active' | 'archived';
  isFeatured: boolean;
  weightGrams: number | null;
  position: number;
  minPriceAmount: number;
  maxPriceAmount: number;
  totalStock: number;
  variantCount: number;
  categories: ApiCategory[];
  attributeValues: ApiAttributeValue[];
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductVariantDto {
  sku: string;
  priceAmount: number;
  compareAtAmount?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  attributeValueIds?: string[];
}

export interface CreateProductDto {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  searchKeywords?: string;
  status?: 'draft' | 'active' | 'archived';
  isFeatured?: boolean;
  weightGrams?: number;
  categoryIds?: string[];
  attributeValueIds?: string[];
  variants: CreateProductVariantDto[];
}

export interface UpdateProductDto {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  searchKeywords?: string;
  status?: 'draft' | 'active' | 'archived';
  isFeatured?: boolean;
  weightGrams?: number;
  categoryIds?: string[];
  attributeValueIds?: string[];
}
