import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal, PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { Faq, FaqDataService, FaqItem } from '@invento/user-site-feature-faq';
import { StoreService, StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';

const MOCK_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How long does standard delivery take?',
    answer: 'Delivery within Egypt typically takes 2 to 4 business days.',
    category: 'shipping',
  },
  {
    id: 'faq-2',
    question: 'Can I return an opened fragrance?',
    answer: 'You can return unopened perfumes within 14 days of receipt.',
    category: 'returns',
  },
];

describe('FAQ Support Hub Integration Tests', () => {
  let fixture: ComponentFixture<Faq>;
  let component: Faq;
  let mockFaqService: Partial<FaqDataService>;
  let mockStoreService: Partial<StoreService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(async () => {
    mockFaqService = {
      faqs: signal(MOCK_FAQS),
      isLoading: signal(false),
      error: signal(null),
      totalQuestions: signal(2),
      loadFaqs: vi.fn(),
    };

    mockStoreService = {
      contactEmail: signal('support@layali.com'),
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
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'storeSlug' ? 'layali' : null),
              },
            },
            queryParams: of({}),
            fragment: of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Faq);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates FAQ component and groups questions into categories', () => {
    expect(component).toBeTruthy();
    expect(component.categories().length).toBe(2);
    expect(component.totalQuestions()).toBe(2);
  });

  it('filters questions by search query and updates visible results', () => {
    component.onSearchChange('delivery');
    expect(component.searchQuery()).toBe('delivery');
    expect(component.matchingQuestionsCount()).toBe(1);
    expect(component.activeFaqItems().some((f: FaqItem) => f.question.includes('delivery'))).toBe(
      true,
    );
  });

  it('sets search query when selecting a quick topic chip', () => {
    component.selectQuickTopic('return');
    expect(component.searchQuery()).toBe('return');
    expect(component.matchingQuestionsCount()).toBe(1);
    expect(component.activeFaqItems().some((f: FaqItem) => f.question.includes('return'))).toBe(
      true,
    );
  });

  it('registers helpfulness vote optimistically', () => {
    const itemId = MOCK_FAQS[0].id ?? 'faq-1';
    component.voteHelpful(itemId, 'yes');
    expect(component.helpfulVotes()[itemId]).toBe('yes');

    component.voteHelpful(itemId, 'no');
    expect(component.helpfulVotes()[itemId]).toBe('no');
  });

  it('dispatches invento:open-chat event when openChatbot() is called with a query', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    component.openChatbot('custom wholesale inquiry');

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invento:open-chat',
      }),
    );
  });
});
