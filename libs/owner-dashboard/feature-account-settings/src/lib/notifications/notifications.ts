import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideMail,
  lucideBell,
  lucideCheck,
  lucideChevronRight,
  lucideUser,
  lucideShield,
  lucideCreditCard,
  lucideStore,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmH1, HlmH3, HlmH4, HlmMuted } from '@spartan/helm/typography';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StatusBanner } from '@invento/shared-ui-status-banner';

export interface PreferenceSetting {
  id: string;
  titleKey: string;
  descKey: string;
  email: boolean;
  inApp: boolean;
}

export interface PreferenceGroup {
  id: string;
  titleKey: string;
  items: PreferenceSetting[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmBadge,
    HlmCardImports,
    HlmButton,
    HlmH1,
    HlmH3,
    HlmH4,
    HlmMuted,
    HlmSwitchImports,
    HlmTooltipImports,
    TranslatePipe,
    StatusBanner,
  ],
  providers: [
    provideIcons({
      lucideMail,
      lucideBell,
      lucideCheck,
      lucideChevronRight,
      lucideUser,
      lucideShield,
      lucideCreditCard,
      lucideStore,
    }),
  ],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications {
  // Initial Default Preference Data
  private defaultGroups: PreferenceGroup[] = [
    {
      id: 'store_activity',
      titleKey: 'notifications.group_store_activity',
      items: [
        {
          id: 'new_orders',
          titleKey: 'notifications.item_new_orders_title',
          descKey: 'notifications.item_new_orders_desc',
          email: true,
          inApp: true,
        },
        {
          id: 'low_stock',
          titleKey: 'notifications.item_low_stock_title',
          descKey: 'notifications.item_low_stock_desc',
          email: true,
          inApp: true,
        },
        {
          id: 'supplier_replies',
          titleKey: 'notifications.item_supplier_replies_title',
          descKey: 'notifications.item_supplier_replies_desc',
          email: false,
          inApp: true,
        },
      ],
    },
    {
      id: 'ai_insights',
      titleKey: 'notifications.group_ai_insights',
      items: [
        {
          id: 'ai_recommendations',
          titleKey: 'notifications.item_ai_recommendations_title',
          descKey: 'notifications.item_ai_recommendations_desc',
          email: false,
          inApp: true,
        },
        {
          id: 'weekly_analytics',
          titleKey: 'notifications.item_weekly_analytics_title',
          descKey: 'notifications.item_weekly_analytics_desc',
          email: true,
          inApp: false,
        },
      ],
    },
    {
      id: 'account',
      titleKey: 'notifications.group_account',
      items: [
        {
          id: 'account_security',
          titleKey: 'notifications.item_account_security_title',
          descKey: 'notifications.item_account_security_desc',
          email: true,
          inApp: true,
        },
      ],
    },
  ];

  // Preference Groups Signal State
  preferenceGroups = signal<PreferenceGroup[]>(JSON.parse(JSON.stringify(this.defaultGroups)));

  // UI State Signals
  isSaved = signal<boolean>(true);
  saveSuccessKey = signal<string | null>(null);
  isFadingOut = signal<boolean>(false);

  // Toggle channel action
  toggleChannel(groupId: string, itemId: string, channel: 'email' | 'inApp') {
    this.preferenceGroups.update((groups) =>
      groups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: group.items.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  [channel]: !item[channel],
                };
              }
              return item;
            }),
          };
        }
        return group;
      }),
    );

    this.isSaved.set(false);
    this.saveSuccessKey.set(null);
  }

  // Save Preferences action
  savePreferences() {
    this.isSaved.set(true);
    this.showFeedback('notifications.save_success');
  }

  // Reset to defaults action
  resetToDefaults() {
    this.preferenceGroups.set(JSON.parse(JSON.stringify(this.defaultGroups)));
    this.isSaved.set(true);
    this.showFeedback('notifications.reset_success');
  }

  private showFeedback(key: string) {
    this.isFadingOut.set(false);
    this.saveSuccessKey.set(key);
    setTimeout(() => {
      this.isFadingOut.set(true);
      setTimeout(() => {
        this.saveSuccessKey.set(null);
        this.isFadingOut.set(false);
      }, 350);
    }, 3500);
  }
}
