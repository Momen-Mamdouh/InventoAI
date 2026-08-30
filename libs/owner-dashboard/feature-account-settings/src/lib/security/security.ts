import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLock,
  lucideEye,
  lucideEyeOff,
  lucideShield,
  lucideCheck,
  lucideAlertCircle,
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
import { HlmCard } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmH1, HlmH2, HlmMuted } from '@spartan/helm/typography';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { HlmSwitchImports } from '@spartan/helm/switch';

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  icon: string;
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIcon,
    HlmCard,
    HlmButton,
    HlmInput,
    HlmLabelImports,
    HlmH1,
    HlmH2,
    HlmMuted,
    HlmTooltipImports,
    TranslatePipe,
    HlmSwitchImports,
  ],
  providers: [
    provideIcons({
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideShield,
      lucideCheck,
      lucideAlertCircle,
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
export class SecurityComponent {
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
  sessions = signal<ActiveSession[]>([
    {
      id: 's1',
      device: 'MacBook Pro',
      browser: 'Chrome 125',
      location: 'Portland, OR, US',
      lastActive: 'Active now',
      isCurrent: true,
      icon: 'lucideMonitor',
    },
    {
      id: 's2',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile',
      location: 'Portland, OR, US',
      lastActive: '2 hours ago',
      isCurrent: false,
      icon: 'lucideSmartphone',
    },
    {
      id: 's3',
      device: 'Windows PC',
      browser: 'Edge 124',
      location: 'Seattle, WA, US',
      lastActive: '3 days ago',
      isCurrent: false,
      icon: 'lucideMonitor',
    },
  ]);

  // Computed helper to check if non-current sessions exist
  hasOtherSessions = computed(() => this.sessions().some((s) => !s.isCurrent));

  clearMessages() {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
  }

  // Update Password Action
  updatePassword() {
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

    // Success
    this.isFadingOut.set(false);
    this.passwordSuccess.set('Password updated successfully!');
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
