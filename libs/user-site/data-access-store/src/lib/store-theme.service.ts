import { DOCUMENT, Injectable, effect, inject } from '@angular/core';
import { buildStoreThemeCss } from '@invento/shared-util-theme';

import { StoreService } from './store.service';

const STYLE_ELEMENT_ID = 'store-theme';

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
 * Composes with `ThemeService` rather than competing with it: that one toggles the `.dark`
 * class on <html>, this one supplies the values that class resolves to.
 */
@Injectable({ providedIn: 'root' })
export class StoreThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storeService = inject(StoreService);

  constructor() {
    effect(() => this.apply(buildStoreThemeCss(this.storeService.store()?.theme)));
  }

  private apply(css: string): void {
    const head = this.document.head;
    if (!head) return;

    let element = this.document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;

    // A store with no theme should fall back to the app defaults, not keep the last one.
    if (!css) {
      element?.remove();
      return;
    }

    if (!element) {
      element = this.document.createElement('style');
      element.id = STYLE_ELEMENT_ID;
      head.appendChild(element);
    }

    if (element.textContent !== css) element.textContent = css;
  }
}
