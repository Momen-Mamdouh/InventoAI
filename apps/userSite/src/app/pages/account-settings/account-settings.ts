import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSettingsSidebarComponent } from './components/account-settings-sidebar/account-settings-sidebar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/core';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    RouterOutlet,
    AccountSettingsSidebarComponent,
    NgIcon,
    HlmButtonImports,
    HlmTypographyImports,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideTrash2 })],
  templateUrl: './account-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsComponent {}
