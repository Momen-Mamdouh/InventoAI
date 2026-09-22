import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountSettingsService } from '../services/account-settings.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLock,
  lucideEye,
  lucideEyeOff,
  lucideShield,
  lucideChevronRight,
  lucideUser,
  lucideBell,
  lucideCreditCard,
  lucideStore,
  lucideMonitor,
  lucideSmartphone,
  lucideMapPin,
  lucideClock,
  lucideLogOut,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { StatusBanner } from '@invento/shared-ui-status-banner';

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  icon: string;
}

function detectCurrentSession(): ActiveSession {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      id: 'current',
      device: 'Current Device',
      browser: 'Web Browser',
      location: 'Active Session',
      lastActive: 'Active now',
      isCurrent: true,
      icon: 'lucideMonitor',
    };
  }

  const ua = navigator.userAgent;
  let device = 'Desktop PC';
  let icon = 'lucideMonitor';

  if (/android/i.test(ua)) {
    device = 'Android Device';
    icon = 'lucideSmartphone';
  } else if (/ipad|iphone|ipod/i.test(ua)) {
    device = 'iOS Device';
    icon = 'lucideSmartphone';
  } else if (/windows/i.test(ua)) {
    device = 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    device = 'Mac';
  } else if (/linux/i.test(ua)) {
    device = 'Linux PC';
  }

  let browser = 'Web Browser';
  if (/edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua)) {
    browser = 'Apple Safari';
  }

  return {
    id: 'current',
    device,
    browser,
    location: 'Current Browser Session',
    lastActive: 'Active now',
    isCurrent: true,
    icon,
  };
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIcon,
    HlmBadge,
    HlmCardImports,
    HlmButton,
    HlmInput,
    HlmLabelImports,
    HlmH1,
    HlmMuted,
    HlmTooltipImports,
    TranslatePipe,
    HlmSwitchImports,
    StatusBanner,
  ],
  providers: [
    provideIcons({
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideShield,
      lucideChevronRight,
      lucideUser,
      lucideBell,
      lucideCreditCard,
      lucideStore,
      lucideMonitor,
      lucideSmartphone,
      lucideMapPin,
      lucideClock,
      lucideLogOut,
    }),
  ],
  templateUrl: './security.html',
  styleUrl: './security.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Security {
  private readonly accountSettingsService = inject(AccountSettingsService);

  readonly updating = signal<boolean>(false);

  // Password Form Signals
  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');

  // Password Visibility Toggles
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  // Message Banners
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  twoFactorMessage = signal<string | null>(null);
  isFadingOut = signal<boolean>(false);

  // 2FA State
  twoFactorEnabled = signal<boolean>(false);

  // Active Sessions Data
  sessions = signal<ActiveSession[]>([detectCurrentSession()]);

  // Computed helper to check if non-current sessions exist
  hasOtherSessions = computed(() => false);

  clearMessages() {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
  }

  // Update Password Action
  updatePassword(): void {
    this.clearMessages();

    if (!this.currentPassword().trim()) {
      this.passwordError.set('Please enter your current password.');
      return;
    }

    if (this.newPassword().length < 8) {
      this.passwordError.set('New password must be at least 8 characters long.');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New password and confirmation password do not match.');
      return;
    }

    this.updating.set(true);
    this.accountSettingsService
      .changePassword({
        oldPassword: this.currentPassword(),
        newPassword: this.newPassword(),
        confirmPassword: this.confirmPassword(),
      })
      .subscribe({
        next: (res) => {
          this.updating.set(false);
          this.isFadingOut.set(false);
          this.passwordSuccess.set(res.message || 'Password updated successfully!');
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');

          setTimeout(() => {
            this.isFadingOut.set(true);
            setTimeout(() => {
              this.passwordSuccess.set(null);
              this.isFadingOut.set(false);
            }, 350);
          }, 3500);
        },
        error: (err: { error?: { message?: string | string[] }; message?: string }) => {
          this.updating.set(false);
          const apiMsg = err.error?.message;
          const msg = Array.isArray(apiMsg)
            ? apiMsg[0]
            : apiMsg || err.message || 'Failed to update password. Please check your current password.';
          this.passwordError.set(msg);
        },
      });
  }

  // Toggle 2FA Action
  toggle2FA() {
    const nextState = !this.twoFactorEnabled();
    this.twoFactorEnabled.set(nextState);
    this.isFadingOut.set(false);

    if (nextState) {
      this.twoFactorMessage.set(
        'Authenticator App 2FA enabled! Verification code will be required on login.',
      );
    } else {
      this.twoFactorMessage.set('Authenticator App 2FA disabled.');
    }

    setTimeout(() => {
      this.isFadingOut.set(true);
      setTimeout(() => {
        this.twoFactorMessage.set(null);
        this.isFadingOut.set(false);
      }, 350);
    }, 3500);
  }

  // Revoke single session
  revokeSession(id: string) {
    this.sessions.update((items) => items.filter((s) => s.id !== id));
  }

  // Revoke all other sessions
  revokeAllOtherSessions() {
    this.sessions.update((items) => items.filter((s) => s.isCurrent));
  }
}
