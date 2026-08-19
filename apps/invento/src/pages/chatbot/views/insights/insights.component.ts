import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmCard } from '@spartan/helm/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUsers, lucideMessageSquare, lucideHelpCircle, lucideAlertCircle, lucideChevronDown, lucideCheckCircle2, lucideXCircle, lucideMinusCircle, lucidePackage } from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { ChatStats } from '../../types/chat-admin.types';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-chatbot-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmCard, NgIcon, DecimalPipe, RouterLink],
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
      lucidePackage
    })
  ],
  templateUrl: './insights.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit {
  private readonly chatService = inject(ChatAdminService);

  stats = signal<ChatStats | null>(null);
  isLoading = signal<boolean>(true);
  
  daysFilter = signal<number>(30);
  
  daysOptions = [
    { value: 7, label: 'Last 7 Days' },
    { value: 30, label: 'Last 30 Days' },
    { value: 90, label: 'Last 90 Days' },
  ];

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.chatService.getChatStats(this.daysFilter()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onDaysChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.daysFilter.set(Number(value));
    this.loadStats();
  }

  getResolutionPercentage(count: number): number {
    const total = this.stats()?.questions || 0;
    if (total === 0) return 0;
    return (count / total) * 100;
  }
}
