import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { HlmCard } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/service/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon, HlmCard, HlmButton, HlmInput],
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
export class ProfileComponent {
  private readonly authService = inject(AuthService);

  // Navigation tab state
  activeTab = signal<string>('profile');

  // Form State initial values
  private readonly currentUser = this.authService.currentUser();
  private initialFullName = this.currentUser
    ? `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim()
    : 'Owner';
  private initialEmail = this.currentUser ? this.currentUser.email : 'owner@inventoai.com';
  private initialPhone = '+1 503 441 9900';
  private initialCompany = 'Luminary Goods LLC';
  private initialTimeZone = 'America/Los_Angeles (UTC-8)';
  private initialLanguage = 'English (US)';
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
  timeZones: string[] = [
    'America/Los_Angeles (UTC-8)',
    'America/New_York (UTC-5)',
    'UTC (GMT+0)',
    'Europe/London (UTC+0)',
    'Africa/Cairo (UTC+2)',
    'Asia/Dubai (UTC+4)',
    'Asia/Tokyo (UTC+9)',
  ];

  languages: string[] = [
    'English (US)',
    'Arabic (العربية)',
    'Spanish (Español)',
    'French (Français)',
    'German (Deutsch)',
  ];

  // Computed initials from full name
  initials = computed(() => {
    const name = this.fullName().trim();
    if (!name) return 'CM';
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

  onEmailChange(val: string) {
    this.email.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onPhoneChange(val: string) {
    this.phone.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onCompanyChange(val: string) {
    this.company.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onTimeZoneChange(val: string) {
    this.timeZone.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
  }

  onLanguageChange(val: string) {
    this.language.set(val);
    this.isSaved.set(false);
    this.saveSuccess.set(false);
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

  // Actions
  saveChanges() {
    this.initialFullName = this.fullName();
    this.initialEmail = this.email();
    this.initialPhone = this.phone();
    this.initialCompany = this.company();
    this.initialTimeZone = this.timeZone();
    this.initialLanguage = this.language();
    this.initialAvatarUrl = this.avatarUrl();

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
  }

  resetForm() {
    this.fullName.set(this.initialFullName);
    this.email.set(this.initialEmail);
    this.phone.set(this.initialPhone);
    this.company.set(this.initialCompany);
    this.timeZone.set(this.initialTimeZone);
    this.language.set(this.initialLanguage);
    this.avatarUrl.set(this.initialAvatarUrl);

    this.isSaved.set(true);
    this.saveSuccess.set(false);
  }
}
