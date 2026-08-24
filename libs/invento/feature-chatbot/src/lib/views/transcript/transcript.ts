import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HlmCard } from '@spartan/helm/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideUser,
  lucideBot,
  lucideCheckCircle2,
  lucideXCircle,
  lucideAlertCircle,
  lucideMinusCircle,
  lucideInfo,
  lucideClock,
} from '@ng-icons/lucide';
import { ChatAdminService } from '../../services/chat-admin.service';
import { ChatTranscript } from '../../types/chat-admin.types';

@Component({
  selector: 'app-chatbot-transcript',
  standalone: true,
  imports: [CommonModule, RouterLink, HlmCard, NgIcon, DatePipe],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideUser,
      lucideBot,
      lucideCheckCircle2,
      lucideXCircle,
      lucideAlertCircle,
      lucideMinusCircle,
      lucideInfo,
      lucideClock,
    }),
  ],
  templateUrl: './transcript.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranscriptComponent implements OnInit {
  private readonly chatService = inject(ChatAdminService);
  private readonly route = inject(ActivatedRoute);

  transcript = signal<ChatTranscript | null>(null);
  isLoading = signal<boolean>(true);
  errorState = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadTranscript(id);
      }
    });
  }

  loadTranscript(id: string) {
    this.isLoading.set(true);
    this.errorState.set(false);
    this.chatService.getChatTranscript(id).subscribe({
      next: (data) => {
        this.transcript.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
