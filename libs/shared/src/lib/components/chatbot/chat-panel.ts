import { ChangeDetectionStrategy, Component, input, output, signal, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBot, lucideX } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/core';
import { ChatUi, type ChatMessage } from './chat-ui';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-chat-panel',
  imports: [NgIcon, ChatUi, TranslatePipe],
  providers: [provideIcons({ lucideBot, lucideX }), CookieService],
  templateUrl: './chat-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanel {
  private cookieService = inject(CookieService);
  readonly title = input('chat_title');
  readonly showHeader = input(true);
  readonly closePanel = output<void>();

  protected readonly messages = signal<ChatMessage[]>([]);

  protected onSend(text: string): void {
    const isOrderQuery = text.toLowerCase().includes('order');
    const isAuthenticated = this.cookieService.check('invento_access_token');
    
    let responseContent = 'I\'ll look into that for you. Let me check the system data.';
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
