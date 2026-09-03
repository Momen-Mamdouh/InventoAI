import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HlmCard } from '@spartan/helm/card';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmButton } from '@spartan/helm/button';
import { HlmH2, HlmH3, HlmH4, HlmMuted } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideAlertTriangle,
  lucideCheckCircle2,
  lucideDatabase,
  lucidePackage,
  lucideFolderTree,
  lucideStore,
  lucideMessageCircleQuestionMark,
} from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { KnowledgeStatus } from '../../types/chat-admin.types';

@Component({
  selector: 'app-chatbot-knowledge',
  standalone: true,
  imports: [
    CommonModule,
    HlmCard,
    HlmButton,
    HlmSpinner,
    NgIcon,
    DatePipe,
    HlmH2,
    HlmH3,
    HlmH4,
    HlmMuted,
  ],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideAlertTriangle,
      lucideCheckCircle2,
      lucideDatabase,
      lucidePackage,
      lucideFolderTree,
      lucideStore,
      lucideMessageCircleQuestionMark,
    }),
  ],
  templateUrl: './knowledge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Knowledge implements OnInit {
  private readonly chatService = inject(ChatAdminService);

  status = signal<KnowledgeStatus | null>(null);
  isLoading = signal<boolean>(true);
  errorState = signal<boolean>(false);

  isRebuilding = signal<boolean>(false);
  rebuildSuccess = signal<boolean>(false);
  rebuildError = signal<string | null>(null);

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.isLoading.set(true);
    this.errorState.set(false);
    this.chatService.getKnowledgeStatus().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.isLoading.set(false);
      },
    });
  }

  rebuildKnowledgeBase() {
    this.isRebuilding.set(true);
    this.rebuildError.set(null);
    this.rebuildSuccess.set(false);

    this.chatService.rebuildKnowledgeBase().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isRebuilding.set(false);
        this.rebuildSuccess.set(true);
        setTimeout(() => this.rebuildSuccess.set(false), 5000);
      },
      error: (err) => {
        this.isRebuilding.set(false);
        if (err.status === 429) {
          this.rebuildError.set(
            'Rebuild requested too recently. Please wait a few minutes before trying again.',
          );
        } else {
          this.rebuildError.set(
            'An error occurred while attempting to rebuild the knowledge base.',
          );
        }
      },
    });
  }

  getSourceIcon(type: string): string {
    switch (type) {
      case 'product':
        return 'lucidePackage';
      case 'faq':
        return 'lucideMessageCircleQuestionMark';
      case 'category':
        return 'lucideFolderTree';
      case 'store_profile':
        return 'lucideStore';
      default:
        return 'lucideDatabase';
    }
  }

  formatSourceName(type: string): string {
    switch (type) {
      case 'product':
        return 'Products';
      case 'faq':
        return 'FAQs';
      case 'category':
        return 'Categories';
      case 'store_profile':
        return 'Store Profile';
      default:
        return type;
    }
  }
}
