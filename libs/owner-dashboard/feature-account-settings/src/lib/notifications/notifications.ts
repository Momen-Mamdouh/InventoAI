import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { HlmCardImports } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmH1, HlmH3, HlmH4, HlmMuted } from '@spartan/helm/typography';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StatusBanner } from '@invento/shared-ui-status-banner';

export interface PreferenceSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  inApp: boolean;
}

export interface PreferenceGroup {
  id: string;
  title: string;
  items: PreferenceSetting[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
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
      title: 'STORE ACTIVITY',
      items: [
        {
          id: 'new_orders',
          title: 'New Orders',
          description: 'When a customer places an order',
          email: true,
          inApp: true,
        },
        {
          id: 'low_stock',
          title: 'Low Stock Alerts',
          description: 'When a product drops below 10 units',
          email: true,
          inApp: true,
        },
        {
          id: 'supplier_replies',
          title: 'Supplier Email Replies',
          description: 'When a supplier responds to an AI-sent email',
          email: false,
          inApp: true,
        },
      ],
    },
    {
      id: 'ai_insights',
      title: 'AI & INSIGHTS',
      items: [
        {
          id: 'ai_recommendations',
          title: 'AI Advisor Recommendations',
          description: 'Weekly inventory and pricing insights',
          email: false,
          inApp: true,
        },
        {
          id: 'weekly_analytics',
          title: 'Weekly Analytics Summary',
          description: 'Every Monday at 9 AM in your timezone',
          email: true,
          inApp: false,
        },
      ],
    },
    {
      id: 'account',
      title: 'ACCOUNT',
      items: [
        {
          id: 'account_security',
          title: 'Account & Security Alerts',
          description: 'New logins, password changes, 2FA events',
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
  saveSuccessMessage = signal<string | null>(null);
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
    this.saveSuccessMessage.set(null);
  }

  // Save Preferences action
  savePreferences() {
    this.isSaved.set(true);
    this.showFeedback('Notification preferences saved successfully!');
  }

  // Reset to defaults action
  resetToDefaults() {
    this.preferenceGroups.set(JSON.parse(JSON.stringify(this.defaultGroups)));
    this.isSaved.set(true);
    this.showFeedback('Notification preferences reset to defaults.');
  }

  private showFeedback(msg: string) {
    this.isFadingOut.set(false);
    this.saveSuccessMessage.set(msg);
    setTimeout(() => {
      this.isFadingOut.set(true);
      setTimeout(() => {
        this.saveSuccessMessage.set(null);
        this.isFadingOut.set(false);
      }, 350);
    }, 3500);
  }
}
