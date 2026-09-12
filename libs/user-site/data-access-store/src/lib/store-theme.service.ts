import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { buildStoreThemeCss } from '@invento/shared-util-theme';

import { StoreService } from './store.service';
import { StoreSlugService } from './store-slug.service';

const STYLE_ELEMENT_ID = 'store-theme';
const THEME_STORAGE_PREFIX = 'invento_store_theme:';

/**
 * Paints the storefront in the colours the site builder generated for the store.
 *
 * `GET /site/:slug` has always returned a `theme` (palette, font, radius) and nothing
 * consumed it, so every tenant rendered in the default blue Spartan palette regardless of
 * what its owner picked.
 *
 * Written as a `<style>` element rather than inline custom properties on the root element
 * for two reasons: it has to define `.dark` as well as `:root`, which inline properties
 * cannot express, and it has to be part of the server-rendered HTML — otherwise every
 * storefront flashes the default palette until hydration. Appending to `<head>` puts it
 * after the app stylesheet, so its `:root` block wins on source order without `!important`.
 *
 * Prevents FOUC / color flashing by:
 * 1. Never destroying server-rendered or pre-cached `<style id="store-theme">` while
 *    a store route is actively resolving or hydrating.
 * 2. Caching generated theme CSS in localStorage by slug so subsequent visits/reloads
 *    render with the correct brand colors from frame 0.
 * 3. Removing `<style id="store-theme">` only when definitively navigating away to a
 *    non-store route or when the store has resolved and confirmed no custom theme.
 *
 * Composes with `ThemeService` rather than competing with it: that one toggles the `.dark`
 * class on <html>, this one supplies the values that class resolves to.
 */
@Injectable({ providedIn: 'root' })
export class StoreThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storeService = inject(StoreService);
  private readonly storeSlugService = inject(StoreSlugService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    effect(() => {
      const slug = this.storeSlugService.slug();
      const store = this.storeService.store();
      const error = this.storeService.error();

      // Case 1: Not on a storefront route (e.g. /store-not-found, bare /)
      if (!slug) {
        this.remove();
        return;
      }

      // Case 2: Store lookup explicitly failed (e.g. 404 or network failure)
      if (error) {
        this.remove();
        return;
      }

      // Case 3: The store for the current slug is resolved
      if (store && store.slug.toLowerCase() === slug.toLowerCase()) {
        const css = buildStoreThemeCss(store.theme);
        if (css) {
          this.apply(css, slug);
          if (this.isBrowser) {
            try {
              localStorage.setItem(THEME_STORAGE_PREFIX + slug, css);
            } catch {
              // Ignore storage quota errors
            }
          }
        } else {
          // Store resolved but has no custom theme: fall back to app defaults
          this.remove();
          if (this.isBrowser) {
            try {
              localStorage.removeItem(THEME_STORAGE_PREFIX + slug);
            } catch {
              // Ignore
            }
          }
        }
        return;
      }

      // Case 4: Store is still resolving or hydrating on a valid slug (store === null or belongs to another slug)
      // Check if existing style belongs to this slug
      const head = this.document.head;
      const element = head
        ? (this.document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null)
        : null;
      const elementSlug = element?.getAttribute('data-slug');

      // If the existing style already belongs to this slug, PRESERVE IT (do NOT remove during hydration!)
      if (element && (!elementSlug || elementSlug.toLowerCase() === slug.toLowerCase())) {
        if (!elementSlug) {
          element.setAttribute('data-slug', slug);
        }
        return;
      }

      // If existing style belongs to a different slug, or no style element exists yet:
      // Try restoring from localStorage cache for this slug in browser
      if (this.isBrowser) {
        let cachedCss: string | null = null;
        try {
          cachedCss = localStorage.getItem(THEME_STORAGE_PREFIX + slug);
        } catch {
          // Ignore
        }
        if (cachedCss) {
          this.apply(cachedCss, slug);
          return;
        }
      }

      // If switching to a new slug that has no cached style, remove previous slug's style
      if (element && elementSlug && elementSlug.toLowerCase() !== slug.toLowerCase()) {
        this.remove();
      }
    });
  }

  private apply(css: string, slug?: string): void {
    const head = this.document.head;
    if (!head) {
      return;
    }

    let element = this.document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

    if (!element) {
      element = this.document.createElement('style');
      element.id = STYLE_ELEMENT_ID;
      head.appendChild(element);
    }

    if (slug) {
      element.setAttribute('data-slug', slug);
    }

    if (element.textContent !== css) {
      element.textContent = css;
    }
  }

  private remove(): void {
    const head = this.document.head;
    if (!head) {
      return;
    }

    const element = this.document.getElementById(STYLE_ELEMENT_ID);
    if (element) {
      element.remove();
    }
  }
}
