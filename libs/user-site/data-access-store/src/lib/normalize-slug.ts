/**
 * Mirrors `BACKEND/src/common/validators/is-slug.decorator.ts` (`SLUG_PATTERN`). If the backend
 * validator changes, change this with it — a mismatch here surfaces as an opaque 400 from the
 * auth endpoints rather than as a local failure.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Canonicalises a raw URL segment or host label into a store slug.
 *
 * Case is *recoverable*, so `/Layali/...` normalises to `layali` rather than being rejected —
 * the backend's own store lookup is case-insensitive (`LOWER(store.slug) = :slug`), so the two
 * now agree. Anything that cannot be a slug at all (`my_store`, `a--b`, `%20`, a matrix-param
 * segment) returns `''`, the documented "no store in this URL" sentinel that `storeGuard`
 * already turns into `/store-not-found`.
 */
export function normalizeSlug(raw: string | null | undefined): string {
  if (!raw) return '';

  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return ''; // malformed percent-encoding, e.g. a lone '%'
  }

  value = value.split(';')[0].trim().toLowerCase();
  return SLUG_PATTERN.test(value) ? value : '';
}
