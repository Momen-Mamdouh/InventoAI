import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUpload,
  lucideTrash2,
  lucideCheck,
  lucideChevronRight,
  lucideChevronDown,
  lucideUser,
  lucideShield,
  lucideBell,
  lucideCreditCard,
  lucideStore,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmSeparator } from '@spartan/helm/separator';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@invento/shared-data-access-auth';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { StatusBanner } from '@invento/shared-ui-status-banner';
import { AccountSettingsService } from '../services/account-settings.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    NgIcon,
    HlmBadge,
    HlmCardImports,
    HlmButton,
    HlmInput,
    HlmLabelImports,
    HlmSelectImports,
    HlmSeparator,
    HlmH1,
    HlmMuted,
    StatusBanner,
  ],
  providers: [
    provideIcons({
      lucideUpload,
      lucideTrash2,
      lucideCheck,
      lucideChevronRight,
      lucideChevronDown,
      lucideUser,
      lucideShield,
      lucideBell,
      lucideCreditCard,
      lucideStore,
    }),
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Profile component managing user profile, contact details, and localization preferences
export class Profile {
  private readonly authService = inject(AuthService);
  private readonly accountSettingsService = inject(AccountSettingsService);
  private readonly localeService = inject(LocaleService);

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Form State initial values
  private readonly currentUser = this.authService.currentUser();
  private initialFullName = this.currentUser
    ? `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim()
    : '';
  private initialEmail = this.currentUser ? this.currentUser.email : '';
  private initialPhone = '';
  private initialCompany = '';
  private initialTimeZone = 'UTC';
  private initialLanguage: string = this.localeService.locale() || 'en';
  private initialAvatarUrl: string | null = this.currentUser?.image || null;

  // Signals
  fullName = signal<string>(this.initialFullName);
  email = signal<string>(this.initialEmail);
  phone = signal<string>(this.initialPhone);
  company = signal<string>(this.initialCompany);
  timeZone = signal<string>(this.initialTimeZone);
  language = signal<string>(this.initialLanguage);
  avatarUrl = signal<string | null>(this.initialAvatarUrl);

  // UI state
  isDragging = signal<boolean>(false);
  isSaved = signal<boolean>(true);
  saveSuccess = signal<boolean>(false);
  isFadingOut = signal<boolean>(false);

  // Dropdown options
  readonly timeZones = [
    { value: 'UTC', labelKey: 'profile.tz_utc' },
    { value: 'Africa/Cairo', labelKey: 'profile.tz_cairo' },
    { value: 'Asia/Riyadh', labelKey: 'profile.tz_riyadh' },
    { value: 'Asia/Dubai', labelKey: 'profile.tz_dubai' },
    { value: 'Europe/London', labelKey: 'profile.tz_london' },
    { value: 'America/New_York', labelKey: 'profile.tz_ny' },
    { value: 'America/Los_Angeles', labelKey: 'profile.tz_la' },
    { value: 'Asia/Tokyo', labelKey: 'profile.tz_tokyo' },
  ] as const;

  readonly languages = [
    { value: 'en', labelKey: 'profile.lang_en' },
    { value: 'ar', labelKey: 'profile.lang_ar' },
  ] as const;

  readonly timeZoneItemToString = (value: unknown): string => {
    const val = String(value || 'UTC');
    const match = this.timeZones.find((tz) => tz.value === val);
    return match ? this.localeService.translate(match.labelKey) : val;
  };

  readonly languageItemToString = (value: unknown): string => {
    const val = String(value || 'en');
    const match = this.languages.find((l) => l.value === val);
    return match ? this.localeService.translate(match.labelKey) : val;
  };

  // Computed initials from full name
  initials = computed(() => {
    const name = this.fullName().trim();
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  // Input change handlers
  onFullNameChange(val: string) {
    this.fullName.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onFullNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.onFullNameChange(input.value);
    }
  }

  onEmailChange(val: string) {
    this.email.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.onEmailChange(input.value);
    }
  }

  onPhoneChange(val: string) {
    this.phone.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.onPhoneChange(input.value);
    }
  }

  onCompanyChange(val: string) {
    this.company.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onCompanyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.onCompanyChange(input.value);
    }
  }

  onTimeZoneChange(val: string | null | undefined): void {
    if (!val) {
      return;
    }
    this.timeZone.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onLanguageChange(val: string | null | undefined): void {
    if (!val) {
      return;
    }
    this.language.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
    if (val === 'en' || val === 'ar') {
      this.localeService.switchLocale(val);
    }
  }

  // File upload handlers
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.readFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.readFile(event.dataTransfer.files[0]);
    }
  }

  private readFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarUrl.set(reader.result as string);
      this.isSaved.set(false);
      this.saveSuccess.set(false);
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.avatarUrl.set(null);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  constructor() {
    this.fetchProfile();
    effect(() => {
      const activeLocale = this.localeService.locale();
      if (this.isSaved()) {
        this.language.set(activeLocale);
      }
    });
  }

  private fetchProfile(): void {
    this.loading.set(true);
    this.accountSettingsService.getProfile().subscribe({
      next: (profile) => {
        this.loading.set(false);
        const name = `${profile.firstName} ${profile.lastName}`.trim();
        this.initialFullName = name || this.initialFullName;
        this.initialEmail = profile.email || this.initialEmail;
        this.initialPhone = profile.phone ?? '';
        this.initialCompany = profile.company ?? '';
        this.initialTimeZone = profile.timeZone ?? this.initialTimeZone;
        const normalizedLang = profile.language === 'ar' ? 'ar' : 'en';
        this.initialLanguage = normalizedLang;
        this.initialAvatarUrl = profile.image;

        this.fullName.set(this.initialFullName);
        this.email.set(this.initialEmail);
        this.phone.set(this.initialPhone);
        this.company.set(this.initialCompany);
        this.timeZone.set(this.initialTimeZone);
        this.language.set(this.initialLanguage);
        this.avatarUrl.set(this.initialAvatarUrl);
        this.isSaved.set(true);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // Actions
  saveChanges(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const name = this.fullName().trim();
    const parts = name.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    this.accountSettingsService
      .updateProfile({
        firstName,
        lastName,
        phone: this.phone().trim() || null,
        company: this.company().trim() || null,
        timeZone: this.timeZone().trim() || null,
        language: this.language().trim() || null,
        image: this.avatarUrl(),
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          const updatedName = `${updated.firstName} ${updated.lastName}`.trim();
          this.initialFullName = updatedName;
          this.initialEmail = updated.email;
          this.initialPhone = updated.phone ?? '';
          this.initialCompany = updated.company ?? '';
          this.initialTimeZone = updated.timeZone ?? this.initialTimeZone;
          this.initialLanguage = updated.language === 'ar' ? 'ar' : 'en';
          this.initialAvatarUrl = updated.image;
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            this.authService.setCurrentUser(
              {
                ...currentUser,
                firstName: updated.firstName,
                lastName: updated.lastName,
                image: updated.image,
              },
              undefined,
              false,
            );
          }

          this.isSaved.set(true);
          this.isFadingOut.set(false);
          this.saveSuccess.set(true);

          setTimeout(() => {
            this.isFadingOut.set(true);
            setTimeout(() => {
              this.saveSuccess.set(false);
              this.isFadingOut.set(false);
            }, 350);
          }, 3500);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          const msg =
            err instanceof Error
              ? err.message
              : 'Could not save profile changes. Please try again.';
          this.errorMessage.set(msg);
        },
      });
  }

  resetForm(): void {
    this.fullName.set(this.initialFullName);
    this.email.set(this.initialEmail);
    this.phone.set(this.initialPhone);
    this.company.set(this.initialCompany);
    this.timeZone.set(this.initialTimeZone);
    this.language.set(this.initialLanguage);
    this.avatarUrl.set(this.initialAvatarUrl);

    this.isSaved.set(true);
    this.saveSuccess.set(false);
    this.errorMessage.set(null);
  }
}
