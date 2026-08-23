import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideMenu,
  lucideShoppingCart,
  lucideUser,
  lucideLogIn,
  lucideSettings,
  lucideLogOut,
} from '@ng-icons/lucide';
import { HlmNavigationMenuImports } from '@spartan/helm/navigation-menu';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmPopoverImports } from '@spartan/helm/popover';
import { BrnPopoverContent } from '@spartan-ng/brain/popover';
import { LangSwitcher } from '@invento/shared-ui-lang-switcher';
import { ThemeSwitcher } from '@invento/shared-ui-theme-switcher';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { CartService } from '@invento/user-site/app/core/service/cart.service';
import { StoreService } from '@invento/user-site/app/core/service/store.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';

interface NavLink {
  /** Translation key resolved in the template via TranslatePipe. */
  labelKey: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmNavigationMenuImports,
    HlmSheetImports,
    HlmButtonImports,
    HlmBadge,
    HlmPopoverImports,
    BrnPopoverContent,
    LangSwitcher,
    ThemeSwitcher,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideMenu,
      lucideShoppingCart,
      lucideUser,
      lucideLogIn,
      lucideLogOut,
      lucideSettings,
    }),
  ],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly router = inject(Router);
  protected readonly cartService = inject(CartService);
  protected readonly authService = inject(AuthService);
  protected readonly storeService = inject(StoreService);

  public readonly isScrolled = signal<boolean>(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 0);
  }

  /** Shared with the home page and every product card, so all three cannot drift apart. */
  protected readonly activeStoreSlug = inject(StoreSlugService).slug;

  /** Derived from the URL signal so the links stay correct without a manual subscription. */
  protected readonly links = computed<NavLink[]>(() => {
    const slug = this.activeStoreSlug();
    return [
      { labelKey: 'nav.home', path: `/${slug}` },
      { labelKey: 'nav.shop', path: `/${slug}/products` },
      { labelKey: 'nav.orders', path: `/${slug}/orders` },
      { labelKey: 'nav.faq', path: `/${slug}/faq` },
    ];
  });

  constructor() {
    // Multi-tenant: the brand shown belongs to the slug in the URL, so refetch when it changes.
    effect(() => this.storeService.load(this.activeStoreSlug()));
  }

  /** userSite had no sign-out anywhere: once signed in there was no way back out. */
  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/', this.activeStoreSlug()]);
  }

  protected readonly cartCount = computed(() => this.cartService.itemCount());
  protected readonly cartBadge = computed(() => {
    const n = this.cartCount();
    return n > 99 ? '99+' : `${n}`;
  });
}
