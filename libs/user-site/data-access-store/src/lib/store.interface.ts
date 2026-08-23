/**
 * Public storefront payload.
 *
 * Mirrors the backend's `StorePublicResponseDto`
 * (BACKEND/src/site-builder/dto/store-public-response.dto.ts), served by
 * `GET /site/:slug` (BACKEND/src/site-builder/site.controller.ts). There is no
 * global API prefix, so the URL is `${apiUrl}/site/${slug}`.
 */

/** Backend `LogoSource` enum: the owner either uploaded a logo or uses generated initials. */
export type LogoSource = 'uploaded' | 'monogram';

export interface StoreHero {
  imageUrl: string | null;
  headline: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

/** Loose on purpose: the palette is a token bag the theme layer consumes wholesale. */
export type StorePalette = Record<string, string>;

export interface StoreThemePublic {
  font: string;
  radius: string;
  light: StorePalette;
  dark: StorePalette;
  style: string;
}

/** Structurally compatible with the product feature's CategoryDto. */
export interface StoreCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number | null;
}

/** Structurally compatible with the product feature's ProductListItem. */
export interface StoreFeaturedProduct {
  title: string;
  slug: string;
  shortDescription: string | null;
  imageUrl: string | null;
  imageAltText: string | null;
  categories: readonly StoreCategory[];
  minPriceAmount: number;
  maxPriceAmount: number;
  inStock: boolean;
  swatches: readonly {
    attributeKey: string;
    attributeName: string;
    value: string;
    slug: string;
    swatchHex: string | null;
  }[];
}

export interface StorePublic {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  logoSource: LogoSource | null;
  locale: string;
  currency: string;
  hero: StoreHero;
  theme: StoreThemePublic | null;
  featuredCategories: StoreCategory[];
  featuredProducts: StoreFeaturedProduct[];
  /**
   * Not yet returned by `GET /site/:slug`. The data exists in the database
   * (`stores.ownerId` -> `users.email`) but no public DTO exposes it, so every consumer must
   * treat these as absent and render nothing until the backend adds them.
   */
  readonly contactEmail?: string | null;
  readonly social?: {
    readonly facebook?: string | null;
    readonly instagram?: string | null;
    readonly twitter?: string | null;
  } | null;
}
