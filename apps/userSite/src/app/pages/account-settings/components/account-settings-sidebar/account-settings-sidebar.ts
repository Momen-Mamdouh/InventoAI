import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideShield, lucideBell, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-account-settings-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon, HlmButtonImports],
  providers: [provideIcons({ lucideUser, lucideShield, lucideBell, lucideTrash2 })],
  templateUrl: './account-settings-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsSidebarComponent {
  // "My Stores" removed for the e-commerce customer-facing profile.
  // "Billing" removed: no payment-method endpoint exists on the backend yet, so the route is
  // unrouted (see account-settings.routes.ts) and has no entry point here.
  navItems: NavItem[] = [
    { label: 'Profile', icon: 'lucideUser', route: 'profile' },
    { label: 'Security', icon: 'lucideShield', route: 'security' },
  ];
}
