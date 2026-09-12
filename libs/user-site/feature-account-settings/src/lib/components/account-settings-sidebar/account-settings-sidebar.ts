import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUser,
  lucideShield,
  lucideHelpCircle,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';

interface NavItem {
  id: 'profile' | 'security';
  label: string;
  icon: string;
  path: (string | undefined)[];
}

@Component({
  selector: 'app-account-settings-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon, TranslatePipe],
  providers: [
    provideIcons({
      lucideUser,
      lucideShield,
      lucideHelpCircle,
      lucideChevronRight,
    }),
  ],
  templateUrl: './account-settings-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsSidebar {
  private readonly router = inject(Router);
  private readonly locale = inject(LocaleService);
  protected readonly storeSlug = inject(StoreSlugService).slug;

  protected readonly navItems = computed<NavItem[]>(() => {
    this.locale.locale();
    const slug = this.storeSlug();
    return [
      {
        id: 'profile',
        label: this.locale.translate('account_settings.sidebar.profile'),
        icon: 'lucideUser',
        path: ['/', slug, 'account-settings', 'profile'],
      },
      {
        id: 'security',
        label: this.locale.translate('account_settings.sidebar.security'),
        icon: 'lucideShield',
        path: ['/', slug, 'account-settings', 'security'],
      },
    ];
  });

  protected isCurrentRoute(path: (string | undefined)[]): boolean {
    const targetUrl = path.filter(Boolean).join('/').replace(/\/+/g, '/');
    const currentUrl = this.router.url.split('?')[0].replace(/\/+$/, '');
    const cleanTarget = (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl).replace(/\/+$/, '');
    return currentUrl === cleanTarget;
  }

  protected onNavClick(path: (string | undefined)[], event: MouseEvent): void {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      void this.router.navigate(path);
    }
  }
}

