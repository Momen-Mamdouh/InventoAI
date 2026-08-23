import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HlmButton } from '@spartan/helm/button';
import { LangSwitcher } from '@invento/shared-ui-lang-switcher';
import { ThemeSwitcher } from '@invento/shared-ui-theme-switcher';
import { AuthService } from '@/app/core/service/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSun, lucideMoon, lucideLayoutDashboard, lucideLogOut } from '@ng-icons/lucide';
import { ApiConfig } from '@/app/core/config/api-config';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, HlmButton, LangSwitcher, ThemeSwitcher, NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideSun, lucideMoon, lucideLayoutDashboard, lucideLogOut })],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly apiConfig = inject(ApiConfig);
  private readonly router = inject(Router);

  readonly isAuthenticated = signal(this.authService.isAuthenticated());
  readonly isDark = signal(false);
  readonly dashboardUrl = this.apiConfig.dashboardUrl;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isDark.set(document.documentElement.classList.contains('dark'));
    }
  }

  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const html = document.documentElement;
      html.classList.toggle('dark');
      this.isDark.set(html.classList.contains('dark'));
    }
  }

  signOut(): void {
    this.authService.logout();
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }
}
