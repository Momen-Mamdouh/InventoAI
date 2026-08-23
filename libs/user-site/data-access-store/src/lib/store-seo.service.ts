import { DOCUMENT, Injectable, REQUEST, computed, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { StoreService } from './store.service';

/**
 * Per-store document metadata: title, description, canonical and social cards.
 *
 * The storefront is server-rendered, but nothing set a `<title>` or a single `<meta>` — every
 * tenant shared the one hardcoded title in `index.html`, so search results and link unfurls
 * were identical for every store. Since SSR is what makes this metadata visible to crawlers
 * in the first place, this is the payoff for running it.
 *
 * Kept as a service rather than living in the home component so product and category pages
 * can layer their own title on top of the same store defaults.
 */
@Injectable({ providedIn: 'root' })
export class StoreSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly storeService = inject(StoreService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Social tags need absolute URLs. On the server the only source of the real origin is the
   * incoming request; in the browser it is `location`. Deriving it rather than hardcoding a
   * domain keeps localhost, preview deployments and production all correct.
   */
  private readonly origin = computed(() => {
    const fromRequest = this.request?.url;
    if (fromRequest) {
      try {
        return new URL(fromRequest).origin;
      } catch {
        /* fall through to the document */
      }
    }
    return this.document.location?.origin ?? '';
  });

  private readonly canonical = computed(() => {
    const path = this.url().split('#')[0];
    const origin = this.origin();
    return origin ? `${origin}${path}` : path;
  });

  constructor() {
    effect(() => {
      const store = this.storeService.store();
      if (!store) return;

      const name = store.name?.trim() || store.slug;
      const description = (store.description || store.hero?.subtitle || '').trim();
      const image = store.hero?.imageUrl || store.logoUrl || '';
      const url = this.canonical();

      this.title.setTitle(name);

      this.setName('description', description);
      this.setProperty('og:site_name', name);
      this.setProperty('og:title', name);
      this.setProperty('og:description', description);
      this.setProperty('og:type', 'website');
      this.setProperty('og:url', url);
      this.setProperty('og:image', this.absolute(image));
      this.setName('twitter:card', image ? 'summary_large_image' : 'summary');
      this.setName('twitter:title', name);
      this.setName('twitter:description', description);
      this.setName('twitter:image', this.absolute(image));

      this.setCanonical(url);
    });
  }

  /** Backend media URLs may already be absolute; only relative ones need the origin. */
  private absolute(value: string): string {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    const origin = this.origin();
    return origin ? `${origin}${value.startsWith('/') ? '' : '/'}${value}` : value;
  }

  private setName(name: string, content: string): void {
    if (content) this.meta.updateTag({ name, content });
    else this.meta.removeTag(`name='${name}'`);
  }

  private setProperty(property: string, content: string): void {
    if (content) this.meta.updateTag({ property, content });
    else this.meta.removeTag(`property='${property}'`);
  }

  private setCanonical(href: string): void {
    if (!href) return;
    const head = this.document.head;
    if (!head) return;

    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
