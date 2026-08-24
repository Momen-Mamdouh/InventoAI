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
    .replace(/[^a-z0-9-]/g, '');
}
