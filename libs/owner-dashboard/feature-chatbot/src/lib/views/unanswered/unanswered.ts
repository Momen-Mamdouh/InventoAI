import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HlmCard } from '@spartan/helm/card';
import { HlmCheckboxImports } from '@spartan/helm/checkbox';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmButton } from '@spartan/helm/button';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmH2, HlmH3, HlmMuted } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideMessageSquare, lucideAlertCircle } from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { UnansweredResponse, UnansweredTheme } from '../../types/chat-admin.types';
import { Pagination } from '@invento/shared-ui-pagination';

@Component({
  selector: 'app-chatbot-unanswered',
  standalone: true,
  imports: [
    CommonModule,
    HlmCard,
    HlmButton,
    HlmSpinner,
    HlmSelectImports,
    NgIcon,
    DatePipe,
    HlmH2,
    HlmH3,
    HlmMuted,
    HlmCheckboxImports,
    Pagination,
  ],
  providers: [
    provideIcons({
      lucideCheck,
      lucideMessageSquare,
      lucideAlertCircle,
    }),
  ],
  templateUrl: './unanswered.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnansweredComponent implements OnInit {
  private readonly chatService = inject(ChatAdminService);

  data = signal<UnansweredResponse | null>(null);
  isLoading = signal<boolean>(true);
  errorState = signal<boolean>(false);

  // Filters
  page = signal<number>(1);
  limit = signal<number>(10);
  days = signal<number>(30);
  includeReviewed = signal<boolean>(false);

  private readonly daysLabels: Record<number, string> = {
    7: 'Last 7 Days',
    30: 'Last 30 Days',
    90: 'Last 90 Days',
  };

  readonly daysItemToString = (value: unknown): string => {
    return this.daysLabels[Number(value)] ?? 'Last 30 Days';
  };

  // Track loading state for individual review actions
  reviewingIds = signal<Set<string>>(new Set<string>());

  ngOnInit() {
    this.loadThemes();
  }

  loadThemes() {
    this.isLoading.set(true);
    this.errorState.set(false);
    this.chatService
      .getUnansweredQuestions({
        page: this.page(),
        limit: this.limit(),
        days: this.days(),
        includeReviewed: this.includeReviewed(),
      })
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorState.set(true);
          this.isLoading.set(false);
        },
      });
  }

  onIncludeReviewedChange(checked: boolean) {
    this.includeReviewed.set(checked);
    this.page.set(1);
    this.loadThemes();
  }

  onDaysChange(val: unknown) {
    this.days.set(Number(val));
    this.page.set(1);
    this.loadThemes();
  }

  markAsReviewed(theme: UnansweredTheme) {
    // The endpoint takes a messageId. We'll use the first messageId of the theme occurrences.
    if (!theme.messageIds || theme.messageIds.length === 0) return;

    const messageId = theme.messageIds[0];

    // Add to reviewing set
    const currentSet = new Set(this.reviewingIds());
    currentSet.add(theme.key);
    this.reviewingIds.set(currentSet);

    this.chatService.reviewUnansweredTheme(messageId).subscribe({
      next: () => {
        // Remove from reviewing set
        const updatedSet = new Set(this.reviewingIds());
        updatedSet.delete(theme.key);
        this.reviewingIds.set(updatedSet);

        // Reload list to get updated status
        this.loadThemes();
      },
      error: () => {
        const updatedSet = new Set(this.reviewingIds());
        updatedSet.delete(theme.key);
        this.reviewingIds.set(updatedSet);
      },
    });
  }

  changePage(newPage: number) {
    if (newPage < 1) return;
    const totalPages = this.data()?.totalPages || 1;
    if (newPage > totalPages) return;

    this.page.set(newPage);
    this.loadThemes();
  }
}
