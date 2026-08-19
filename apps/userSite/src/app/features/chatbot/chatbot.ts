import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBotMessageSquare,
  lucideX,
  lucideSendHorizonal,
  lucidePlus,
  lucideHistory,
  lucideMessageSquare,
} from '@ng-icons/lucide';
import { HlmPopoverImports } from '@spartan/helm/popover';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from './service/chat.service';
import { ProductCard } from '../product/components/product-card/product-card';
import { RouterModule } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-chatbot',
  imports: [
    NgIcon,
    HlmPopoverImports,
    HlmButtonImports,
    HlmInputImports,
    FormsModule,
    ProductCard,
    RouterModule,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './chatbot.html',
  viewProviders: [
    provideIcons({
      lucideBotMessageSquare,
      lucideX,
      lucideSendHorizonal,
      lucidePlus,
      lucideHistory,
    }),
  ],
})
export class Chatbot implements OnInit {
  inputMessage = '';

  private readonly chatService = inject(ChatService);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);
  readonly showWidget = signal<boolean>(false);
  readonly storeName = signal<string>('');
  readonly chatHistory = signal<{ sessionId: string; updatedAt: string }[]>([]);
  readonly isHistoryOpen = signal<boolean>(false);

  private sessionId?: string;
  private initialGreeting = 'How can I help you today?';
  protected readonly storeSlug = 'layali';

  // Mock conversation data removed per user request

  ngOnInit() {
    this.loadHistory();
    this.sessionId = localStorage.getItem('chatbot_session_id') || undefined;
    this.chatService.getChatSettings(this.storeSlug).subscribe({
      next: (settings) => {
        if (settings.isEnabled) {
          this.showWidget.set(true);
          if (settings.storeName) {
            this.storeName.set(settings.storeName);
          }
          this.initialGreeting = settings.greeting || 'How can I help you today?';
          this.loadConversation(this.initialGreeting);
        }
      },
      error: (err) => {
        console.warn('Settings API not ready, using mock settings.', err);
        this.showWidget.set(true);
        this.storeName.set('Store'); // Fallback if API fails
        this.loadConversation(
          "Hi! I'm Layali Abayas's assistant — ask me about our products, an order or our policies.",
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

    this.chatService.getChatConversation(this.storeSlug, this.sessionId).subscribe({
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

  private scrollToElement(elementId?: string) {
    setTimeout(() => {
      try {
        if (elementId) {
          const el = document.getElementById(elementId);
          if (el) {
            // Scroll so the top of the element is visible
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }

        // Fallback: scroll to bottom
        const container = document.getElementById('chat-scroll-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      } catch (err) {}
    }, 50);
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

    this.chatService.sendChatMessage(this.storeSlug, userText, this.sessionId).subscribe({
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
        console.warn('API send message failed, using mock response.', err);
        const mockMsgId = crypto.randomUUID();
        this.messages.update((msgs) => [
          ...msgs,
          {
            id: mockMsgId,
            role: 'assistant',
            text: "Sorry, I couldn't get that right now — please try again in a moment. (Mock response: backend not implemented)",
            resolution: 'error',
            createdAt: new Date().toISOString(),
          },
        ]);
        this.isSending.set(false);
        this.scrollToElement('msg-' + mockMsgId);
      },
    });
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
      const history = localStorage.getItem('chatbot_history');
      if (history) {
        this.chatHistory.set(JSON.parse(history));
      }
    } catch (e) {}
  }

  private saveCurrentSessionToHistory() {
    if (!this.sessionId || this.messages().length <= 1) return; // don't save empty chats

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
    localStorage.setItem('chatbot_history', JSON.stringify(history));
  }

  toggleHistory() {
    this.isHistoryOpen.update((v) => !v);
  }

  closeHistory() {
    this.isHistoryOpen.set(false);
  }

  selectSession(sessionId: string) {
    this.isHistoryOpen.set(false);
    if (!sessionId) return;

    this.sessionId = sessionId;
    localStorage.setItem('chatbot_session_id', sessionId);
    this.loadConversation(this.initialGreeting);
  }
}
