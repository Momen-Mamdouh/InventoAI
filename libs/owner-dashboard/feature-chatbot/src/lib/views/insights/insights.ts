import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HlmCard } from '@spartan/helm/card';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmSelectImports } from '@spartan/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucideMessageSquare,
  lucideHelpCircle,
  lucideAlertCircle,
  lucideChevronDown,
  lucideCheckCircle2,
  lucideXCircle,
  lucideMinusCircle,
  lucidePackage,
} from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { ChatStats } from '../../types/chat-admin.types';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-chatbot-insights',
  standalone: true,
  imports: [CommonModule, HlmCard, HlmSpinner, HlmSelectImports, NgIcon, DecimalPipe, RouterLink],
  providers: [
    provideIcons({
      lucideUsers,
      lucideMessageSquare,
      lucideHelpCircle,
      lucideAlertCircle,
      lucideChevronDown,
      lucideCheckCircle2,
      lucideXCircle,
      lucideMinusCircle,
      lucidePackage,
    }),
  ],
  templateUrl: './insights.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit {
  private readonly chatService = inject(ChatAdminService);

  stats = signal<ChatStats | null>(null);
  isLoading = signal<boolean>(true);
  errorState = signal<boolean>(false);

  daysFilter = signal<number>(30);

  daysOptions = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  readonly daysItemToString = (value: unknown): string => {
    const opt = this.daysOptions.find((o) => o.value === Number(value));
    return opt ? opt.label : 'Last 30 Days';
  };

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.errorState.set(false);
    this.chatService.getChatStats(this.daysFilter()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onDaysChange(value: unknown) {
    this.daysFilter.set(Number(value));
    this.loadStats();
  }

  getResolutionPercentage(count: number): number {
    const total = this.stats()?.questions || 0;
    if (total === 0) return 0;
    return (count / total) * 100;
  }
}
