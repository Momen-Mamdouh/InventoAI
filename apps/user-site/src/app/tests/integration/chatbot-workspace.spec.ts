import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Chatbot, ChatService, ChatMessage } from '@invento/user-site-feature-chatbot';
import { StoreService, StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Chatbot Workspace Integration Tests', () => {
  let fixture: ComponentFixture<Chatbot>;
  let component: Chatbot;
  let mockChatService: Partial<ChatService>;
  let mockStoreService: Partial<StoreService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(async () => {
    localStorage.clear();
    mockChatService = {
      getChatSettings: vi.fn().mockReturnValue(
        of({
          isEnabled: true,
          storeName: 'Layali Fragrances',
          greeting: 'Welcome to Layali! How may I assist you today?',
        }),
      ),
      getChatConversation: vi.fn().mockReturnValue(of({ messages: [] })),
      sendChatMessage: vi.fn().mockReturnValue(
        of({
          sessionId: 'sess-1',
          message: {
            id: 'reply-1',
            role: 'assistant',
            text: 'Our best seller is Royal Amber EDP.',
            resolution: 'answered',
            createdAt: new Date().toISOString(),
          },
          resolution: 'answered',
          products: [],
        }),
      ),
    };

    mockStoreService = {
      currency: signal('USD'),
      logoUrl: signal('https://example.com/logo.png'),
      monogram: signal('LF'),
    };

    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    await TestBed.configureTestingModule({
      imports: [Chatbot],
      providers: [
        provideRouter([]),
        { provide: ChatService, useValue: mockChatService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Chatbot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Chatbot component and loads initial greeting', () => {
    expect(component).toBeTruthy();
    expect(component.showWidget()).toBe(true);
    expect(component.messages().length).toBeGreaterThan(0);
    expect(component.messages()[0].role).toBe('assistant');
  });

  it('toggles focus mode workspace between compact popover and 96vw workspace', () => {
    expect(component.isFocusMode()).toBe(false);
    component.enterFocusMode();
    expect(component.isFocusMode()).toBe(true);

    component.exitFocusMode();
    expect(component.isFocusMode()).toBe(false);
  });

  it('toggles full screen mode for extended support conversations', () => {
    expect(component.isFullScreen()).toBe(false);
    component.toggleFullScreen();
    expect(component.isFullScreen()).toBe(true);

    component.toggleFullScreen();
    expect(component.isFullScreen()).toBe(false);
  });

  it('handles external open-chat window events to focus assistant with prefilled query', () => {
    const customEvent = new CustomEvent('invento:open-chat', {
      detail: { query: 'Where is my order?', focus: true },
    });

    component.onExternalOpenChat(customEvent);
    expect(component.inputMessage).toBe('Where is my order?');
    expect(component.isFocusMode()).toBe(true);
  });

  it('sends user message and appends assistant response to conversation', () => {
    component.inputMessage = 'What perfumes do you recommend?';
    component.sendMessage();

    expect(mockChatService.sendChatMessage).toHaveBeenCalledWith(
      'layali',
      'What perfumes do you recommend?',
      undefined,
    );
    expect(component.inputMessage).toBe('');
    expect(
      component
        .messages()
        .some((m: ChatMessage) => m.text === 'Our best seller is Royal Amber EDP.'),
    ).toBe(true);
  });
});
