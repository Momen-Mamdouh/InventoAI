import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCard } from '@spartan/helm/card';
import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmH3, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideFilter,
  lucideEye,
  lucideUser,
  lucideMessageSquare,
  lucideAlertCircle,
} from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { ChatSessionsResponse } from '../../types/chat-admin.types';
import { Pagination } from '@invento/shared-ui-pagination';

@Component({
  selector: 'app-chatbot-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HlmBadge,
    HlmCard,
    HlmInput,
    HlmButton,
    HlmSelectImports,
    HlmSpinner,
    HlmTableImports,
    HlmH3,
    HlmMuted,
    HlmSmall,
    NgIcon,
    DatePipe,
    Pagination,
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideFilter,
      lucideEye,
      lucideUser,
      lucideMessageSquare,
      lucideAlertCircle,
    }),
  ],
  templateUrl: './history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class History implements OnInit {
  private readonly chatService = inject(ChatAdminService);

  data = signal<ChatSessionsResponse | null>(null);
  isLoading = signal<boolean>(true);
  errorState = signal<boolean>(false);

  // Filters
  page = signal<number>(1);
  limit = signal<number>(10);
  search = signal<string>('');
  hasUnanswered = signal<boolean | undefined>(undefined);
  isSignedIn = signal<boolean | undefined>(undefined);

  readonly unansweredFilterValue = signal<string>('all');
  readonly signedInFilterValue = signal<string>('all');

  private readonly unansweredLabels: Record<string, string> = {
    all: 'All Questions',
    true: 'Has Unanswered',
    false: 'Fully Answered',
  };

  private readonly signedInLabels: Record<string, string> = {
    all: 'All Users',
    true: 'Signed In',
    false: 'Guests',
  };

  readonly unansweredItemToString = (val: unknown): string => {
    return this.unansweredLabels[String(val)] ?? 'All Questions';
  };

  readonly signedInItemToString = (val: unknown): string => {
    return this.signedInLabels[String(val)] ?? 'All Users';
  };

  // Temp form models
  searchInput = '';

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions() {
    this.isLoading.set(true);
    this.errorState.set(false);
    this.chatService
      .getChatSessions({
        page: this.page(),
        limit: this.limit(),
        search: this.search(),
        hasUnanswered: this.hasUnanswered(),
        isSignedIn: this.isSignedIn(),
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

  onSearchSubmit() {
    this.search.set(this.searchInput);
    this.page.set(1);
    this.loadSessions();
  }

  onUnansweredChange(val: string | null | undefined) {
    const v = val || 'all';
    this.unansweredFilterValue.set(v);
    if (v === 'all') {
      this.hasUnanswered.set(undefined);
    } else if (v === 'true') {
      this.hasUnanswered.set(true);
    } else {
      this.hasUnanswered.set(false);
    }
    this.page.set(1);
    this.loadSessions();
  }

  onSignedInChange(val: string | null | undefined) {
    const v = val || 'all';
    this.signedInFilterValue.set(v);
    if (v === 'all') {
      this.isSignedIn.set(undefined);
    } else if (v === 'true') {
      this.isSignedIn.set(true);
    } else {
      this.isSignedIn.set(false);
    }
    this.page.set(1);
    this.loadSessions();
  }

  changePage(newPage: number) {
    if (newPage < 1) return;
    const totalPages = this.data()?.totalPages || 1;
    if (newPage > totalPages) return;

    this.page.set(newPage);
    this.loadSessions();
  }
}
