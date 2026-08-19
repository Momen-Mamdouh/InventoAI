import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMessageSquare, lucideX } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/core';
import { ChatUi, type ChatMessage } from './chat-ui';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-chat-popup',
  imports: [NgIcon, ChatUi, TranslatePipe],
  providers: [provideIcons({ lucideMessageSquare, lucideX }), CookieService],
  templateUrl: './chat-popup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPopup {
  private cookieService = inject(CookieService);
  protected readonly isOpen = signal(false);
  protected readonly messages = signal<ChatMessage[]>([]);

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected onSend(text: string): void {
    const isOrderQuery = text.toLowerCase().includes('order');
    const isAuthenticated = this.cookieService.check('invento_access_token');
    
    let responseContent = 'Thanks for your message! Our team will get back to you shortly.';
    if (isOrderQuery && !isAuthenticated) {
      responseContent = 'Please login to view or manage orders.';
    }

    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: text },
      { role: 'assistant', content: responseContent },
    ]);
  }
}
