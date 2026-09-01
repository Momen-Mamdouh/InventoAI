import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmMuted } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideSave } from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { ChatbotSettings, UpdateChatbotSettingsDto } from '../../types/chat-admin.types';
import { StatusBanner } from '@invento/shared-ui-status-banner';

@Component({
  selector: 'app-chatbot-settings',
  standalone: true,
  imports: [
    FormsModule,
    HlmCardImports,
    HlmSpinner,
    HlmButton,
    HlmInput,
    HlmLabelImports,
    HlmSelectImports,
    HlmSwitchImports,
    HlmMuted,
    NgIcon,
    StatusBanner,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideSave,
    }),
  ],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly chatService = inject(ChatAdminService);

  settings = signal<ChatbotSettings | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  isFadingOut = signal<boolean>(false);

  // Form State
  isEnabled = signal<boolean>(false);
  greeting = signal<string>('');
  tone = signal<'friendly' | 'formal' | 'playful'>('friendly');
  contactEmail = signal<string>('');

  tones = [
    { value: 'friendly', label: 'Friendly & Helpful' },
    { value: 'formal', label: 'Professional & Formal' },
    { value: 'playful', label: 'Playful & Casual' },
  ];

  readonly toneItemToString = (value: unknown): string => {
    const t = this.tones.find((item) => item.value === String(value));
    return t ? t.label : 'Friendly & Helpful';
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.chatService.getChatbotSettings().subscribe({
      next: (data) => {
        this.settings.set(data);
        this.isEnabled.set(data.isEnabled);
        this.greeting.set(data.greeting || '');
        this.tone.set(data.tone);
        this.contactEmail.set(data.contactEmail || '');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  saveSettings() {
    this.isSaving.set(true);
    const updateDto: UpdateChatbotSettingsDto = {
      isEnabled: this.isEnabled(),
      greeting: this.greeting() || null,
      tone: this.tone(),
      contactEmail: this.contactEmail() || null,
    };

    this.chatService.updateChatbotSettings(updateDto).subscribe({
      next: (updatedSettings) => {
        this.settings.set(updatedSettings);
        this.isSaving.set(false);
        this.showSuccess();
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  private showSuccess() {
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
}
