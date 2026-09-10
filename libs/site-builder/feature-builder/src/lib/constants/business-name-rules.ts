export interface BusinessNameCheck {
  readonly id: number;
  readonly labelKey: string;
  readonly passes: (name: string) => boolean;
}

const SPECIAL_CHARS = /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
const STARTS_WITH_DIGIT = /^\d/;

/**
 * Format rules for a business name, shown live under the Validation input.
 * Each check runs against the trimmed name; an empty name fails everything
 * except the length rule's own emptiness handling.
 */
export const BUSINESS_NAME_CHECKS: readonly BusinessNameCheck[] = [
  {
    id: 1,
    labelKey: 'validation_check_length',
    passes: (name) => name.length >= 3 && name.length <= 25,
  },
  {
    id: 2,
    labelKey: 'validation_check_special',
    passes: (name) => name.length > 0 && !SPECIAL_CHARS.test(name),
  },
  {
    id: 3,
    labelKey: 'validation_check_number',
    passes: (name) => name.length > 0 && !STARTS_WITH_DIGIT.test(name),
  },
] as const;

/** Turns a business name into a URL-safe domain slug. */
export function toDomainSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/** Cleans and sanitizes typed domain input in real time. */
export function sanitizeDomainSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export interface DomainSlugCheck {
  readonly id: number;
  readonly labelKey: string;
  readonly passes: (slug: string) => boolean;
}

export const DOMAIN_SLUG_CHECKS: readonly DomainSlugCheck[] = [
  {
    id: 11,
    labelKey: 'validation_domain_check_length',
    passes: (slug) => slug.length >= 3 && slug.length <= 30,
  },
  {
    id: 12,
    labelKey: 'validation_domain_check_chars',
    passes: (slug) => slug.length > 0 && /^[a-z0-9-]+$/.test(slug),
  },
  {
    id: 13,
    labelKey: 'validation_domain_check_hyphens',
    passes: (slug) => slug.length > 0 && !slug.startsWith('-') && !slug.endsWith('-') && !slug.includes('--'),
  },
] as const;

/** Slugs reserved for system infrastructure and protected routing paths. */
export const RESERVED_DOMAIN_SLUGS: readonly string[] = [
  'admin',
  'api',
  'auth',
  'app',
  'store',
  'stores',
  'dashboard',
  'settings',
  'user',
  'users',
  'invento',
  'inventoai',
  'root',
  'null',
  'undefined',
  'test',
  'shop',
  'help',
  'support',
] as const;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_DOMAIN_SLUGS.includes(slug.toLowerCase().trim());
}

/** Generates smart alternative domain slugs for taken domains or inspiration. */
export function generateAlgorithmicSuggestions(name: string): string[] {
  const base = toDomainSlug(name) || 'store';
  return [
    `${base}-shop`,
    `${base}-store`,
    `${base}-official`,
    `get-${base}`,
    `${base}-online`,
  ];
}

export interface BrandMetrics {
  readonly memorability: number;
  readonly brandability: number;
  readonly professionalTone: number;
  readonly pronunciation: number;
  readonly pronunciationGrade: string;
}

/** Computes dynamic brand intelligence metrics based on store name characteristics. */
export function calculateBrandMetrics(name: string): BrandMetrics {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      memorability: 0,
      brandability: 0,
      professionalTone: 0,
      pronunciation: 0,
      pronunciationGrade: '---',
    };
  }

  const length = trimmed.length;
  // Ideal branding length is 4-10 characters
  const lengthScore = length >= 4 && length <= 10 ? 98 : length < 4 ? 82 : Math.max(78, 100 - (length - 10) * 2);
  const hasNoNumbers = !/\d/.test(trimmed);
  const brandScore = Math.min(99, Math.round(lengthScore * (hasNoNumbers ? 1.0 : 0.88)));
  const memorability = Math.min(98, Math.round((brandScore + (length < 8 ? 6 : 0))));
  const professionalTone = Math.min(99, Math.round(88 + (length >= 5 ? 8 : 4)));
  const pronunciation = length <= 8 ? 96 : 88;

  return {
    memorability: Math.min(99, Math.max(75, memorability)),
    brandability: Math.min(99, Math.max(72, brandScore)),
    professionalTone: Math.min(99, Math.max(80, professionalTone)),
    pronunciation: Math.min(99, Math.max(78, pronunciation)),
    pronunciationGrade: length <= 8 ? 'Fluent' : 'Standard',
  };
}

