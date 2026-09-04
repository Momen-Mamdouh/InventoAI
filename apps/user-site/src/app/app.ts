import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { Footer, Navbar } from '@invento/user-site-feature-storefront';
import { Chatbot } from '@invento/user-site-feature-chatbot';
import { HlmToasterImports } from '@spartan/helm/sonner';
import {
  StoreSeoService,
  StoreThemeService,
  StoreService,
  StoreSlugService,
} from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';

@Component({
  imports: [RouterModule, Chatbot, Navbar, Footer, HlmToasterImports],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'user-site';

  /**
   * Both are root-provided and purely reactive, so nothing injects them otherwise and they
   * would never be constructed. Injecting here starts them once, for every route — the
   * store's palette and metadata belong to the whole storefront, not just the landing page.
   */
  private readonly storeTheme = inject(StoreThemeService);
  private readonly storeSeo = inject(StoreSeoService);

  private readonly router = inject(Router);
  private readonly storeSlugService = inject(StoreSlugService);
  private readonly storeService = inject(StoreService);
  private readonly themeService = inject(ThemeService);
  private readonly localeService = inject(LocaleService);

  /**
   * HlmToaster's `theme` input defaults to 'light' and never consults the app,
   * so in dark mode every toast came up as a white card over a dark page.
   */
  protected readonly toasterTheme = computed<'light' | 'dark'>(() =>
    this.themeService.isDark() ? 'dark' : 'light',
  );

  /** `position` is physical, so a fixed bottom-right lands on the wrong side in Arabic. */
  protected readonly toasterPosition = computed<'bottom-left' | 'bottom-right'>(() =>
    this.localeService.isRtl() ? 'bottom-left' : 'bottom-right',
  );

  /** Same `NavigationEnd` + `toSignal` pattern as `StoreSlugService.currentUrl`. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Navbar, footer and chatbot are storefront chrome: they belong only on pages that
   * actually represent a tenant's storefront. Without this they also rendered on the
   * no-store page, the store-not-found page, the 404 page and the auth pages — on bare
   * `/` the slug is `''`, so the navbar's `links` computed produced broken paths like `//faq`.
   */
  protected readonly showStorefrontChrome = computed(() => {
    if (!this.storeSlugService.slug()) return false;
    if (!this.storeService.store()) return false;

    const path = this.currentUrl().split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    // segments[0] is the store slug; segments[1] === 'auth' means login/register/etc, which
    // render inside their own AuthLayout rather than the storefront chrome.
    return segments[1] !== 'auth';
  });
}
