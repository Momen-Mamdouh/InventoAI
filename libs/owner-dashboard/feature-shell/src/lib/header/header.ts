import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight } from '@ng-icons/lucide';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HlmBreadcrumbImports } from '@spartan/helm/breadcrumb';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { ThemeSwitcher } from '@invento/shared-ui-theme-switcher';
import { LangSwitcher } from '@invento/shared-ui-lang-switcher';
import { BreadcrumbService } from '@invento/owner-dashboard-util-breadcrumb';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    NgIcon,
    TranslatePipe,
    HlmBreadcrumbImports,
    ThemeSwitcher,
    LangSwitcher,
  ],
  providers: [
    provideIcons({
      lucideChevronRight,
    }),
  ],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly router = inject(Router);

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
}
