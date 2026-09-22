import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { PurchaseRequests } from '@invento/owner-dashboard-feature-purchase-requests';
import {
  PurchaseRequestsState,
  PurchaseRequestDetail,
  MailboxStatus,
} from '@invento/owner-dashboard-data-access-purchase-request';
import { ProductService } from '@invento/owner-dashboard-data-access-product';
import { SupplierService } from '@invento/owner-dashboard-data-access-supplier';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Purchase Requests Management Integration Tests', () => {
  let fixture: ComponentFixture<PurchaseRequests>;
  let component: PurchaseRequests;
  let stateMock: {
    requests: ReturnType<typeof signal<PurchaseRequestDetail[]>>;
    total: ReturnType<typeof signal<number>>;
    page: ReturnType<typeof signal<number>>;
    limit: ReturnType<typeof signal<number>>;
    totalPages: ReturnType<typeof signal<number>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    statusFilter: ReturnType<typeof signal<string>>;
    selected: ReturnType<typeof signal<PurchaseRequestDetail | null>>;
    detailLoading: ReturnType<typeof signal<boolean>>;
    mailbox: ReturnType<typeof signal<MailboxStatus | null>>;
    mailboxLoading: ReturnType<typeof signal<boolean>>;
    kpis: ReturnType<typeof signal<unknown>>;
    loadRequests: ReturnType<typeof vi.fn>;
    loadKpis: ReturnType<typeof vi.fn>;
    loadMailbox: ReturnType<typeof vi.fn>;
    openDetail: ReturnType<typeof vi.fn>;
    closeDetail: ReturnType<typeof vi.fn>;
    setPage: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
  };
  let productServiceMock: {
    getProducts: ReturnType<typeof vi.fn>;
  };
  let supplierServiceMock: {
    list: ReturnType<typeof vi.fn>;
  };
  let isRtlSignal: ReturnType<typeof signal<boolean>>;
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof signal<boolean>>;
  };

  const mockRequests: PurchaseRequestDetail[] = [
    {
      id: 'pr-1',
      productId: 'p-1',
      variantId: 'v-1',
      productTitle: 'Lithium-Ion Battery Pack',
      variantLabel: '5000mAh',
      quantity: 500,
      neededWithinDays: 14,
      subject: 'Inquiry for Lithium-Ion Battery Pack',
      body: 'Looking for 500 units of 5000mAh battery pack',
      note: 'Initial restock for Q4 inventory',
      status: 'sent',
      draftStatus: 'ai',
      offerCount: 1,
      receivedCount: 0,
      sentAt: '2026-09-20T08:00:00Z',
      confirmedAt: null,
      confirmedOfferId: null,
      createdAt: '2026-09-20T08:00:00Z',
      updatedAt: '2026-09-20T08:00:00Z',
      offers: [],
    },
    {
      id: 'pr-2',
      productId: 'p-2',
      variantId: 'v-2',
      productTitle: 'USB-C Braided Cable',
      variantLabel: '2 Meter Black',
      quantity: 1200,
      neededWithinDays: 7,
      subject: 'Inquiry for USB-C Braided Cable',
      body: 'Looking for 1200 units of USB-C cable',
      note: 'High demand accessory',
      status: 'confirmed',
      draftStatus: 'fallback',
      offerCount: 2,
      receivedCount: 1,
      sentAt: '2026-09-19T10:00:00Z',
      confirmedAt: '2026-09-20T12:00:00Z',
      confirmedOfferId: 'off-1',
      createdAt: '2026-09-19T10:00:00Z',
      updatedAt: '2026-09-20T12:00:00Z',
      offers: [],
    },
  ];

  const mockMailboxStatus: MailboxStatus = {
    isSupported: true,
    isConnected: true,
    provider: 'gmail',
    accountEmail: 'procurement@inventoai.shop',
    status: 'connected',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    isSyncing: false,
    lastSyncedAt: '2026-09-22T10:00:00Z',
    lastError: null,
    connectedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    stateMock = {
      requests: signal<PurchaseRequestDetail[]>(mockRequests),
      total: signal(2),
      page: signal(1),
      limit: signal(10),
      totalPages: signal(1),
      loading: signal(false),
      error: signal(null),
      statusFilter: signal('all'),
      selected: signal<PurchaseRequestDetail | null>(null),
      detailLoading: signal(false),
      mailbox: signal<MailboxStatus | null>(mockMailboxStatus),
      mailboxLoading: signal(false),
      kpis: signal({
        totalRequests: 2,
        pendingOffers: 1,
        repliedOffers: 1,
        approvedRequests: 1,
      }),
      loadRequests: vi.fn(),
      loadKpis: vi.fn(),
      loadMailbox: vi.fn(),
      openDetail: vi.fn((id: string) => {
        stateMock.selected.set(mockRequests.find((r) => r.id === id) || null);
      }),
      closeDetail: vi.fn(() => {
        stateMock.selected.set(null);
      }),
      setPage: vi.fn(),
      setStatusFilter: vi.fn(),
    };

    productServiceMock = {
      getProducts: vi.fn().mockReturnValue(of({ items: [] })),
    };

    supplierServiceMock = {
      list: vi.fn().mockReturnValue(of({ items: [] })),
    };

    isRtlSignal = signal(false);
    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: isRtlSignal,
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PurchaseRequests],
      providers: [
        provideRouter([]),
        { provide: PurchaseRequestsState, useValue: stateMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: SupplierService, useValue: supplierServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseRequests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates PurchaseRequests component and loads requests on initialization', () => {
    expect(component).toBeDefined();
    expect(stateMock.loadRequests).toHaveBeenCalled();
    expect(component.requests().length).toBe(2);
  });

  it('opens and closes slide-over detail drawer for selected request', () => {
    expect(component.selected()).toBeNull();

    component.openDetail('pr-1');
    expect(stateMock.openDetail).toHaveBeenCalledWith('pr-1');

    component.closeDetail();
    expect(stateMock.closeDetail).toHaveBeenCalled();
  });

  it('opens and closes create purchase request drawer', () => {
    expect(component.showCreate()).toBe(false);

    component.openCreate();
    expect(component.showCreate()).toBe(true);

    component.closeCreate();
    expect(component.showCreate()).toBe(false);
  });

  it('computes drawer slide side based on RTL locale state', () => {
    isRtlSignal.set(false);
    expect(component['sheetSide']()).toBe('right');

    isRtlSignal.set(true);
    expect(component['sheetSide']()).toBe('left');
  });
});
