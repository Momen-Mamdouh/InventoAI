import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBarChart3,
  lucideSettings,
  lucideDatabase,
  lucideMessageSquare,
  lucideAlertCircle,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-chatbot-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NgIcon],
  providers: [
    provideIcons({
      lucideBarChart3,
      lucideSettings,
      lucideDatabase,
      lucideMessageSquare,
      lucideAlertCircle,
    }),
  ],
  templateUrl: './chatbot.layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotLayoutComponent {}
