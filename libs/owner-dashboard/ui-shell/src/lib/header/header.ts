import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmButton } from '@spartan/helm/button';
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
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';

import { BreadcrumbService } from '@invento/owner-dashboard-util-breadcrumb';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgIcon, HlmButton, TranslatePipe, HlmBreadcrumbImports],
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
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);

  protected readonly isDark = this.themeService.isDark;
  private readonly currentUrl = signal<string>(this.router.url);

  protected readonly breadcrumbs = computed<{ label: string; route: string }[]>(() => {
    const url = this.currentUrl();
    const dynamicLabels = this.breadcrumbService.labels();
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

        let label = dynamicLabels[segment] || dynamicLabels[currentRoute];
        if (!label) {
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
            /^[0-9a-f]{24}$/i.test(segment);
          if (isUuid) {
            label = 'Details';
          } else {
            label = segment.replace(/-/g, ' ');
            label = label.charAt(0).toUpperCase() + label.slice(1);
          }
        }

        breadcrumbs.push({ label, route: currentRoute });
      }
    }

    return breadcrumbs;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
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
