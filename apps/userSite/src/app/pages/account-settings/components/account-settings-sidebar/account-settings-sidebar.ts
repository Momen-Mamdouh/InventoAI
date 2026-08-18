import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUser,
  lucideShield,
  lucideBell,
  lucideCreditCard,
  lucideTrash2,
} from '@ng-icons/lucide';
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
  providers: [
    provideIcons({ lucideUser, lucideShield, lucideBell, lucideCreditCard, lucideTrash2 }),
  ],
  templateUrl: './account-settings-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsSidebarComponent {
  // "My Stores" removed for the e-commerce customer-facing profile.
  // "Billing & Plan" renamed to "Billing".
  navItems: NavItem[] = [
    { label: 'Profile', icon: 'lucideUser', route: 'profile' },
    { label: 'Security', icon: 'lucideShield', route: 'security' },
    { label: 'Billing', icon: 'lucideCreditCard', route: 'billing' },
  ];
}
