export { productsListRoutes, productDetailsRoutes } from './lib/product.routes';

/**
 * Documented exception to "export routes, not components" (`contracts/library-api.md` rule 3):
 * `ProductCard` is legitimately composed by `feature-home`'s landing page (the storefront's
 * featured-products section), so it is exported alongside the routes. No other component is —
 * the other 11 stay internal to this library's own pages.
 */
export { ProductCard } from './lib/components';
