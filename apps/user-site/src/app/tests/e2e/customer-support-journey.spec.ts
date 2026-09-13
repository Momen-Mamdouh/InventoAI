import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { signal, PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';

import { Faq, FaqDataService } from '@invento/user-site-feature-faq';
import { Chatbot, ChatService } from '@invento/user-site-feature-chatbot';
import { StoreService, StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';

const MOCK_FAQS = [
  {
    id: 'faq-delivery',
    question: 'How fast is express delivery to Dubai and Cairo?',
    answer: 'Standard delivery takes 2 business days; same-day delivery is available in Cairo.',
    category: 'shipping',
  },
  {
    id: 'faq-sample',
    question: 'Can I get free samples with my order?',
    answer: 'Yes, every order over 100 USD includes two complimentary 2ml sample vials.',
    category: 'orders',
  },
];

describe('E2E Simulated Customer Journey: FAQ to AI Concierge Support', () => {
  let mockFaqService: Partial<FaqDataService>;
  let mockChatService: Partial<ChatService>;
  let mockStoreService: Partial<StoreService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(() => {
    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockStoreService = {
      contactEmail: signal('concierge@layali.com'),
      currency: signal('USD'),
      logoUrl: signal('https://example.com/logo.png'),
      monogram: signal('LF'),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    mockFaqService = {
      faqs: signal(MOCK_FAQS),
      isLoading: signal(false),
      error: signal(null),
      totalQuestions: signal(2),
      loadFaqs: vi.fn(),
    };

    mockChatService = {
      getChatSettings: vi.fn().mockReturnValue(
        of({
          isEnabled: true,
          storeName: 'Layali Luxury Scents',
          greeting: 'Hello! I am your Layali Fragrance Concierge. How may I assist you?',
        }),
      ),
      getChatConversation: vi.fn().mockReturnValue(of({ messages: [] })),
      sendChatMessage: vi.fn().mockReturnValue(
        of({
          sessionId: 'sess-concierge-1',
          message: {
            id: 'msg-reply-1',
            role: 'assistant',
            text: 'I recommend our best seller Royal Amber EDP for an enchanting evening scent.',
            resolution: 'answered',
            createdAt: new Date().toISOString(),
          },
          resolution: 'answered',
          products: [
            {
              id: 'prod-amber',
              title: 'Royal Amber EDP',
              slug: 'royal-amber',
              minPriceAmount: 180,
              imageUrl: 'https://example.com/amber.jpg',
            },
          ],
        }),
      ),
    };
  });

  it('navigates FAQ knowledge base and smoothly transitions into interactive AI chat session', async () => {
    // ----------------------------------------------------
    // STAGE 1: FAQ Knowledge Base Search & Interaction
    // ----------------------------------------------------
    const faqFixture = TestBed.configureTestingModule({
      imports: [Faq],
      providers: [
        provideRouter([]),
        { provide: FaqDataService, useValue: mockFaqService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'layali' } },
            queryParams: of({}),
            fragment: of(null),
          },
        },
      ],
    }).createComponent(Faq);

    faqFixture.detectChanges();
    const faqComponent = faqFixture.componentInstance;

    expect(faqComponent).toBeTruthy();
    expect(faqComponent.categories().length).toBe(2);

    // Customer searches for "sample"
    faqComponent.onSearchChange('sample');
    expect(faqComponent.searchQuery()).toBe('sample');
    expect(faqComponent.matchingQuestionsCount()).toBe(1);
    expect(faqComponent.activeFaqItems()[0].id).toBe('faq-sample');

    // Customer votes helpful on the answer
    faqComponent.voteHelpful('faq-sample', 'yes');
    expect(faqComponent.helpfulVotes()['faq-sample']).toBe('yes');

    // Customer wants more customized perfume advice, triggers AI Assistant handoff
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    faqComponent.openChatbot('What perfume has amber and vanilla notes?');

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invento:open-chat',
        detail: { query: 'What perfume has amber and vanilla notes?' },
      }),
    );

    faqFixture.destroy();

    // ----------------------------------------------------
    // STAGE 2: Chatbot Concierge Interaction & Product Recommendation
    // ----------------------------------------------------
    TestBed.resetTestingModule();
    const chatFixture = TestBed.configureTestingModule({
      imports: [Chatbot],
      providers: [
        provideRouter([]),
        { provide: ChatService, useValue: mockChatService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).createComponent(Chatbot);

    chatFixture.detectChanges();
    const chatComponent = chatFixture.componentInstance;

    expect(chatComponent).toBeTruthy();
    expect(chatComponent.showWidget()).toBe(true);
    expect(chatComponent.messages().length).toBeGreaterThan(0);

    // Chatbot receives hand-off event from FAQ
    const event = new CustomEvent('invento:open-chat', {
      detail: { query: 'What perfume has amber and vanilla notes?', focus: true },
    });
    chatComponent.onExternalOpenChat(event);

    expect(chatComponent.inputMessage).toBe('What perfume has amber and vanilla notes?');
    expect(chatComponent.isFocusMode()).toBe(true);

    // Customer sends the message
    chatComponent.sendMessage();

    expect(mockChatService.sendChatMessage).toHaveBeenCalledWith(
      'layali',
      'What perfume has amber and vanilla notes?',
      undefined,
    );

    // Assistant reply received with product recommendation
    expect(chatComponent.messages().some((m) => m.text.includes('Royal Amber EDP'))).toBe(true);

    // Customer enters full screen mode for extended conversation
    chatComponent.toggleFullScreen();
    expect(chatComponent.isFullScreen()).toBe(true);

    // Customer rates AI response
    const assistantMsg = chatComponent.messages().find((m) => m.role === 'assistant');
    if (assistantMsg) {
      chatComponent.voteMessage(assistantMsg.id, 'yes');
      expect(chatComponent.messageFeedback()[assistantMsg.id]).toBe('yes');
    }

    chatFixture.destroy();
  });
});
