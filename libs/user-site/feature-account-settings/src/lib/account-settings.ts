import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSparkles } from '@ng-icons/lucide';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { AccountSettingsSidebar } from './components/account-settings-sidebar/account-settings-sidebar';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    RouterOutlet,
    AccountSettingsSidebar,
    NgIcon,
    HlmTypographyImports,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideSparkles })],
  templateUrl: './account-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettings {}

