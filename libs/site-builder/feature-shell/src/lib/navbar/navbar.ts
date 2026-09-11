import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan/helm/button';
import { LangSwitcher } from '@invento/shared-ui-lang-switcher';
import { ThemeSwitcher } from '@invento/shared-ui-theme-switcher';
import { SignOutButton } from '@invento/shared-ui-sign-out-button';
import { AuthService } from '@invento/shared-data-access-auth';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideUser,
  lucideArrowRight,
  lucideArrowLeft,
} from '@ng-icons/lucide';
import { ApiConfig } from '@invento/site-builder-data-access-preview';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    HlmButton,
    LangSwitcher,
    ThemeSwitcher,
    SignOutButton,
    NgIcon,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideUser,
      lucideArrowRight,
      lucideArrowLeft,
    }),
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly apiConfig = inject(ApiConfig);
  private readonly localeService = inject(LocaleService);

  readonly isRtl = this.localeService.isRtl;
  readonly currentUser = this.authService.currentUser;
  readonly ownerName = computed(() => this.currentUser()?.firstName || '');
  readonly isAuthenticated = computed(
    () => !!this.authService.currentUser() || this.authService.isAuthenticated(),
  );
  readonly dashboardUrl = computed(() =>
    this.authService.getSsoUrl(this.apiConfig.dashboardUrl, '/home'),
  );
}
