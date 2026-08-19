import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmButton } from '@spartan/helm/button';
import { HlmBadge } from '@spartan/helm/badge';
import {
  lucideBell,
  lucideGlobe,
  lucideMoon,
  lucideSun,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HlmBreadcrumbImports } from '@spartan/helm/breadcrumb';
import { TranslatePipe, LocaleService, ThemeService } from '@invento/core';
import { BrandLogo } from '@invento/shared';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgIcon, HlmButton, HlmBadge, TranslatePipe, HlmBreadcrumbImports],
  providers: [
    provideIcons({
      lucideBell,
      lucideGlobe,
      lucideMoon,
      lucideSun,
      lucideChevronRight,
    }),
  ],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly localeService = inject(LocaleService);
  private readonly themeService = inject(ThemeService);
  protected readonly isDark = this.themeService.isDark;
  protected readonly breadcrumbs = signal<{ label: string; route: string }[]>([]);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.updateBreadcrumbs(event.urlAfterRedirects);
      });

    // Initial breadcrumb generation
    this.updateBreadcrumbs(this.router.url);
  }

  private updateBreadcrumbs(url: string): void {
    const segments = url
      .split('?')[0]
      .split('/')
      .filter((s) => s);

    // Always start with Storefront
    const breadcrumbs = [{ label: 'Storefront', route: '/' }];

    if (segments.length > 0) {
      let currentRoute = '';
      for (const segment of segments) {
        currentRoute += `/${segment}`;

        // Format label (e.g., 'acc-setting' -> 'Acc Setting', 'products' -> 'Products')
        let label = segment.replace(/-/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);

        breadcrumbs.push({ label, route: currentRoute });
      }
    }

    this.breadcrumbs.set(breadcrumbs);
  }

  switchLocale(): void {
    const next = this.localeService.locale() === 'en' ? 'ar' : 'en';
    this.localeService.switchLocale(next);
  }

  /**
   * Delegates to the shared ThemeService rather than poking classList and
   * localStorage directly. The hand-rolled version was invisible to the rest of
   * the app — App could not read it to theme the toaster — and being
   * localStorage-only it flashed the wrong theme on every SSR load.
   */
  toggleTheme(): void {
    this.themeService.toggle();
  }
}
