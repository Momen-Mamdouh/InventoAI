import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FaqManagement } from '@invento/owner-dashboard-feature-faq';
import { FaqStore, FaqEntry } from '@invento/owner-dashboard-data-access-faq';
import { LocaleService } from '@invento/shared-util-i18n';

describe('FAQ Management Integration Tests', () => {
  let fixture: ComponentFixture<FaqManagement>;
  let component: FaqManagement;
  let faqStoreMock: {
    entries: ReturnType<typeof signal<FaqEntry[]>>;
    filteredEntries: ReturnType<typeof signal<FaqEntry[]>>;
    categories: ReturnType<typeof signal<string[]>>;
    categoryFilter: ReturnType<typeof signal<string>>;
    statusFilter: ReturnType<typeof signal<'all' | 'published' | 'draft'>>;
    searchQuery: ReturnType<typeof signal<string>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    isFull: ReturnType<typeof signal<boolean>>;
    isFiltering: ReturnType<typeof signal<boolean>>;
    stats: ReturnType<
      typeof signal<{ total: number; published: number; drafts: number; capacity: number }>
    >;
    load: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setCategoryFilter: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
  };
  let isRtlSignal: ReturnType<typeof signal<boolean>>;
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof signal<boolean>>;
  };

  const mockFaqEntries: FaqEntry[] = [
    {
      id: 'faq-1',
      question: 'What is your return policy?',
      answer: 'We accept returns within 14 days of delivery.',
      category: 'returns',
      isPublished: true,
      position: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'faq-2',
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 2-4 business days.',
      category: 'shipping',
      isPublished: true,
      position: 2,
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'faq-3',
      question: 'Do you offer international shipping?',
      answer: 'Currently we ship locally in Egypt.',
      category: 'shipping',
      isPublished: false,
      position: 3,
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-03T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    faqStoreMock = {
      entries: signal<FaqEntry[]>(mockFaqEntries),
      filteredEntries: signal<FaqEntry[]>(mockFaqEntries),
      categories: signal<string[]>(['returns', 'shipping']),
      categoryFilter: signal<string>('all'),
      statusFilter: signal<'all' | 'published' | 'draft'>('all'),
      searchQuery: signal<string>(''),
      loading: signal(false),
      error: signal(null),
      isFull: signal(false),
      isFiltering: signal(false),
      stats: signal({
        total: 3,
        published: 2,
        drafts: 1,
        capacity: 100,
      }),
      load: vi.fn(),
      setSearchQuery: vi.fn(),
      setCategoryFilter: vi.fn(),
      setStatusFilter: vi.fn(),
    };

    isRtlSignal = signal(false);
    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: isRtlSignal,
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FaqManagement],
      providers: [
        { provide: FaqStore, useValue: faqStoreMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates FaqManagement component and calls store.load on init', () => {
    expect(component).toBeDefined();
    expect(faqStoreMock.load).toHaveBeenCalled();
    expect(component.store.entries().length).toBe(3);
    expect(component.store.stats().total).toBe(3);
    expect(component.store.stats().published).toBe(2);
    expect(component.store.stats().drafts).toBe(1);
  });

  it('opens and closes slide-over drawer for creating a new question', () => {
    expect(component.isDrawerOpen()).toBe(false);

    component.openCreateDrawer();
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.editingEntry()).toBeNull();

    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);
  });

  it('opens edit drawer populated with existing question data', () => {
    component.openEditDrawer(mockFaqEntries[0]);
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.editingEntry()).toEqual(mockFaqEntries[0]);
  });

  it('computes sheetSide as left in RTL and right in LTR', () => {
    isRtlSignal.set(false);
    expect(component['sheetSide']()).toBe('right');

    isRtlSignal.set(true);
    expect(component['sheetSide']()).toBe('left');
  });
});
