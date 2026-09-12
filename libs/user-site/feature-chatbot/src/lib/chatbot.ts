import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  effect,
  HostListener,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBotMessageSquare,
  lucideX,
  lucideSendHorizonal,
  lucidePlus,
  lucideHistory,
  lucideMessageSquare,
  lucideChevronDown,
  lucideMaximize2,
  lucideMinimize2,
  lucideExpand,
  lucideShrink,
  lucideMinus,
  lucideCopy,
  lucideCheck,
  lucideThumbsUp,
  lucideThumbsDown,
  lucideRotateCcw,
  lucideExternalLink,
  lucideArrowUpRight,
  lucideSparkles,
  lucideTruck,
  lucidePackage,
  lucideHelpCircle,
  lucideMail,
  lucideBot,
} from '@ng-icons/lucide';
import { HlmPopoverImports } from '@spartan/helm/popover';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmDropdownMenuImports } from '@spartan/helm/dropdown-menu';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan/helm/sonner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { StoreSlugService, StoreService } from '@invento/user-site-data-access-store';
import { HlmP, HlmMuted } from '@spartan/helm/typography';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { ChatService, ChatMessage } from './service/chat.service';

export interface PromptStarter {
  readonly id: string;
  readonly labelKey: string;
  readonly icon: string;
  readonly query: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    HlmPopoverImports,
    HlmButtonImports,
    HlmInputImports,
    HlmDropdownMenuImports,
    FormsModule,
    RouterModule,
    CurrencyPipe,
    DatePipe,
    HlmP,
    HlmMuted,
    HlmTooltipImports,
    HlmBadgeImports,
    HlmDialogImports,
    BrnDialogImports,
    TranslatePipe,
  ],
  templateUrl: './chatbot.html',
  viewProviders: [
    provideIcons({
      lucideBotMessageSquare,
      lucideX,
      lucideSendHorizonal,
      lucidePlus,
      lucideHistory,
      lucideMessageSquare,
      lucideChevronDown,
      lucideMaximize2,
      lucideMinimize2,
      lucideExpand,
      lucideShrink,
      lucideMinus,
      lucideCopy,
      lucideCheck,
      lucideThumbsUp,
      lucideThumbsDown,
      lucideRotateCcw,
      lucideExternalLink,
      lucideArrowUpRight,
      lucideSparkles,
      lucideTruck,
      lucidePackage,
      lucideHelpCircle,
      lucideMail,
      lucideBot,
    }),
  ],
})
export class Chatbot implements OnInit {
  inputMessage = '';

  @HostListener('window:invento:open-chat', ['$event'])
  onExternalOpenChat(event: Event): void {
    if (event instanceof CustomEvent && event.detail?.query) {
      this.inputMessage = event.detail.query;
      if (event.detail?.focus) {
        this.enterFocusMode();
      }
    }
  }

  private readonly chatService = inject(ChatService);
  private readonly storeSlugService = inject(StoreSlugService);
  private readonly storeService = inject(StoreService);
  private readonly locale = inject(LocaleService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);
  readonly showWidget = signal<boolean>(false);
  readonly storeName = signal<string>('');
  readonly chatHistory = signal<{ sessionId: string; updatedAt: string }[]>([]);

  readonly storeCurrency = this.storeService.currency;
  readonly storeLogo = this.storeService.logoUrl;
  readonly storeMonogram = this.storeService.monogram;

  readonly isFocusMode = signal<boolean>(false);
  readonly isFullScreen = signal<boolean>(false);
  readonly copiedMessageId = signal<string | null>(null);
  readonly messageFeedback = signal<Record<string, 'yes' | 'no'>>({});

  readonly promptStarters: readonly PromptStarter[] = [
    {
      id: 'track_order',
      labelKey: 'chatbot.prompt_track_order',
      icon: 'lucidePackage',
      query: 'Where is my order and how can I track it?',
    },
    {
      id: 'shipping',
      labelKey: 'chatbot.prompt_shipping',
      icon: 'lucideTruck',
      query: 'What are your shipping policies and delivery timelines?',
    },
    {
      id: 'returns',
      labelKey: 'chatbot.prompt_returns',
      icon: 'lucideRotateCcw',
      query: 'What is your return and refund policy?',
    },
    {
      id: 'bestsellers',
      labelKey: 'chatbot.prompt_bestsellers',
      icon: 'lucideSparkles',
      query: 'Can you recommend popular products and bestsellers in this store?',
    },
    {
      id: 'contact',
      labelKey: 'chatbot.prompt_contact',
      icon: 'lucideMail',
      query: 'How can I contact the store owner or customer support directly?',
    },
  ];

  private sessionId?: string;
  private initialGreeting = 'How can I help you today?';
  protected readonly storeSlug = this.storeSlugService.slug;

  // Mock conversation data removed per user request

  private hasLoadedSettings = false;

  constructor() {
    effect(() => {
      const slug = this.storeSlug();
      if (slug && !this.hasLoadedSettings) {
        this.hasLoadedSettings = true;
        this.loadChatSettings(slug);
      }
    });
  }

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      this.loadHistory();
      this.sessionId = localStorage.getItem('chatbot_session_id') || undefined;
    }
  }

  private loadChatSettings(slug: string) {
    this.chatService.getChatSettings(slug).subscribe({
      next: (settings) => {
        if (settings.isEnabled) {
          this.showWidget.set(true);
          if (settings.storeName) {
            this.storeName.set(settings.storeName);
          }
          this.initialGreeting =
            settings.effectiveGreeting || settings.greeting || 'How can I help you today?';
          this.loadConversation(this.initialGreeting);
        }
      },
      error: (err) => {
        console.warn('Settings API not ready, using mock settings.', err);
        this.showWidget.set(true);

        // Use the slug to create a decent fallback name if the API fails
        const slug = this.storeSlug() || 'Store';
        const formattedName = slug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        this.storeName.set(formattedName);
        this.loadConversation(
          `Hi! I'm ${formattedName}'s assistant — ask me about our products, an order or our policies.`,
        );
      },
    });
  }

  loadConversation(greeting: string) {
    this.isLoading.set(true);

    const greetingMsg: ChatMessage = {
      id: 'greeting',
      role: 'assistant',
      text: greeting,
      resolution: 'answered',
      createdAt: new Date().toISOString(),
    };

    if (!this.sessionId) {
      this.messages.set([greetingMsg]);
      this.isLoading.set(false);
      return;
    }

    this.chatService.getChatConversation(this.storeSlug(), this.sessionId).subscribe({
      next: (conversation) => {
        this.messages.set([greetingMsg, ...conversation.messages]);
        this.isLoading.set(false);
        this.scrollToElement('msg-greeting');
      },
      error: (err) => {
        console.warn('API not ready or conversation empty. Starting with greeting only.', err);
        this.messages.set([greetingMsg]);
        this.isLoading.set(false);
        this.scrollToElement('msg-greeting');
      },
    });
  }

  toggleFocusMode(): void {
    const next = !this.isFocusMode();
    this.isFocusMode.set(next);
    if (next) {
      this.scrollToElement();
    }
  }

  enterFocusMode(): void {
    this.isFocusMode.set(true);
    this.scrollToElement();
  }

  exitFocusMode(): void {
    this.isFocusMode.set(false);
    this.isFullScreen.set(false);
  }

  toggleFullScreen(): void {
    this.isFullScreen.update((v) => !v);
  }

  onFocusDialogStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.isFocusMode.set(false);
      this.isFullScreen.set(false);
    }
  }

  @HostListener('window:keydown.escape')
  onEscapePressed(): void {
    if (this.isFullScreen()) {
      this.isFullScreen.set(false);
      return;
    }
    if (this.isFocusMode()) {
      this.exitFocusMode();
    }
  }

  applyPromptStarter(query: string): void {
    this.inputMessage = query;
    this.sendMessage();
  }

  copyMessageText(msg: ChatMessage): void {
    if (!msg.text || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    navigator.clipboard
      .writeText(msg.text)
      .then(() => {
        this.copiedMessageId.set(msg.id);
        toast.success(this.locale.translate('chatbot.message_copied'));
        setTimeout(() => {
          if (this.copiedMessageId() === msg.id) {
            this.copiedMessageId.set(null);
          }
        }, 2000);
      })
      .catch((err) => {
        console.warn('Failed to copy chat message text', err);
      });
  }

  voteMessage(msgId: string, vote: 'yes' | 'no'): void {
    this.messageFeedback.update((prev) => {
      const next = { ...prev };
      if (next[msgId] === vote) {
        delete next[msgId];
      } else {
        next[msgId] = vote;
      }
      return next;
    });
  }

  closeFocusModeOnNav(): void {
    this.isFocusMode.set(false);
    this.isFullScreen.set(false);
  }

  onInputKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToElement(elementId?: string): void {
    setTimeout(() => {
      try {
        if (elementId) {
          const el = document.getElementById(elementId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }

        const containerId = this.isFocusMode()
          ? 'focus-chat-scroll-container'
          : 'chat-scroll-container';
        const container = document.getElementById(containerId);
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      } catch (err) {
        console.warn('scrollToElement failed', err);
      }
    }, 60);
  }

  sendMessage() {
    if (!this.inputMessage.trim() || this.isSending()) return;

    const userText = this.inputMessage.trim();
    this.inputMessage = '';

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userText,
      resolution: null,
      createdAt: new Date().toISOString(),
    };

    this.messages.update((msgs) => [...msgs, userMsg]);
    this.isSending.set(true);
    this.scrollToElement('typing-indicator');

    const trySend = (retryWithoutSession = false) => {
      const activeSessionId = retryWithoutSession ? undefined : this.sessionId;

      this.chatService.sendChatMessage(this.storeSlug(), userText, activeSessionId).subscribe({
        next: (res) => {
          if (res.sessionId && res.sessionId !== this.sessionId) {
            this.sessionId = res.sessionId;
            localStorage.setItem('chatbot_session_id', this.sessionId);
          }

          this.saveCurrentSessionToHistory();

          const assistantMsg: ChatMessage = {
            id: res.message.id,
            role: 'assistant',
            text: res.message.text,
            resolution: res.resolution,
            createdAt: res.message.createdAt,
            products: res.products,
            faqs: res.faqs,
            order: res.order,
            requiresLogin: res.requiresLogin,
          };

          this.messages.update((msgs) => [...msgs, assistantMsg]);
          this.isSending.set(false);
          this.scrollToElement('msg-' + assistantMsg.id);
        },
        error: (err) => {
          // If the backend returns 404 (Conversation Not Found), the session expired or was deleted.
          // Clear the session ID and silently retry the request as a brand new conversation.
          if (err.status === 404 && !retryWithoutSession) {
            console.warn('Chat session expired or not found. Retrying as a new session...');
            this.sessionId = undefined;
            localStorage.removeItem('chatbot_session_id');
            trySend(true);
            return;
          }

          console.warn('API send message failed, using fallback response.', err);
          const mockMsgId = crypto.randomUUID();
          this.messages.update((msgs) => [
            ...msgs,
            {
              id: mockMsgId,
              role: 'assistant',
              text: "I'm currently unable to connect to the store's knowledge base. Please try again later or contact support if you need immediate assistance.",
              resolution: 'error',
              createdAt: new Date().toISOString(),
            },
          ]);
          this.isSending.set(false);
          this.scrollToElement('msg-' + mockMsgId);
        },
      });
    };

    trySend();
  }

  startNewChat() {
    this.sessionId = undefined;
    localStorage.removeItem('chatbot_session_id');
    const greetingMsg: ChatMessage = {
      id: 'greeting',
      role: 'assistant',
      text: this.initialGreeting,
      resolution: null,
      createdAt: new Date().toISOString(),
    };
    this.messages.set([greetingMsg]);
    this.scrollToElement('msg-greeting');
  }

  private loadHistory() {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      const history = localStorage.getItem('chatbot_history');
      if (history) {
        this.chatHistory.set(JSON.parse(history));
      }
    } catch (e) {
      console.warn('loadHistory failed', e);
    }
  }

  private saveCurrentSessionToHistory() {
    if (!this.sessionId || this.messages().length <= 1) {
      return; // don't save empty chats
    }

    let history = this.chatHistory();
    const existingIdx = history.findIndex((h) => h.sessionId === this.sessionId);
    if (existingIdx >= 0) {
      history = [...history];
      history[existingIdx] = { ...history[existingIdx], updatedAt: new Date().toISOString() };
    } else {
      history = [{ sessionId: this.sessionId, updatedAt: new Date().toISOString() }, ...history];
    }

    history.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    this.chatHistory.set(history);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chatbot_history', JSON.stringify(history));
    }
  }

  selectSession(sessionId: string) {
    if (!sessionId) {
      return;
    }

    this.sessionId = sessionId;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chatbot_session_id', sessionId);
    }
    this.loadConversation(this.initialGreeting);
  }
}
