import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideStore,
  lucidePlus,
  lucideSun,
  lucideMoon,
  lucideGlobe,
  lucideLogOut,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { TranslatePipe, LocaleService, ThemeService } from '@invento/core';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '../../core/service/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-no-store',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmButton, TranslatePipe],
  templateUrl: './no-store.html',
  styleUrl: './no-store.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideStore,
      lucidePlus,
      lucideSun,
      lucideMoon,
      lucideGlobe,
      lucideLogOut,
    }),
  ],
})
export class NoStoreComponent {
  private readonly localeService = inject(LocaleService);
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);

  readonly isDark = this.themeService.isDark;
  readonly siteBuilderUrl = signal<string>(
    (environment as { siteBuilderUrl?: string }).siteBuilderUrl ||
      (environment.production ? 'https://test-site-builder.vercel.app' : 'http://localhost:4200'),
  );

  toggleTheme(): void {
    this.themeService.toggle();
  }

  switchLocale(): void {
    const next = this.localeService.locale() === 'en' ? 'ar' : 'en';
    this.localeService.switchLocale(next);
  }

  logout(): void {
    this.authService.logout();
    toast.success('Logged out successfully');
  }
}
