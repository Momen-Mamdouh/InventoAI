export interface StorefrontHomeHero {
  headline?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

export interface StorefrontHomeCategory {
  id?: string | null;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  productCount?: number | null;
}

export interface StorefrontHomeProduct {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  shortDescription?: string | null;
  price?: string | null;
  minPriceAmount?: number | null;
  maxPriceAmount?: number | null;
  imageUrl?: string | null;
  img?: string | null;
  inStock?: boolean | null;
  categories?: readonly { slug: string; name?: string }[] | null;
}
