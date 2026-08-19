import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideShield, lucideBell, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { LocaleService, TranslatePipe } from '@invento/core';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-account-settings-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon, HlmButtonImports, TranslatePipe],
  providers: [provideIcons({ lucideUser, lucideShield, lucideBell, lucideTrash2 })],
  templateUrl: './account-settings-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsSidebarComponent {
  // Tab labels are data, not template text, so they are translated here rather than by the pipe
  // (same pattern as OrdersFilterBarComponent).
  private readonly locale = inject(LocaleService);

  // "My Stores" removed for the e-commerce customer-facing profile.
  // "Billing" removed: no payment-method endpoint exists on the backend yet, so the route is
  // unrouted (see account-settings.routes.ts) and has no entry point here.
  protected readonly navItems = computed<NavItem[]>(() => {
    this.locale.locale(); // re-compute labels when the language changes
    return [
      {
        label: this.locale.translate('account_settings.sidebar.profile'),
        icon: 'lucideUser',
        route: 'profile',
      },
      {
        label: this.locale.translate('account_settings.sidebar.security'),
        icon: 'lucideShield',
        route: 'security',
      },
    ];
  });
}
