import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Suppliers } from '@invento/owner-dashboard-feature-suppliers';
import { SuppliersState, Supplier } from '@invento/owner-dashboard-data-access-supplier';
import { PurchaseRequests } from '@invento/owner-dashboard-feature-purchase-requests';
import {
  PurchaseRequestsState,
  PurchaseRequestDetail,
  MailboxStatus,
} from '@invento/owner-dashboard-data-access-purchase-request';
import { ProductService } from '@invento/owner-dashboard-data-access-product';
import { SupplierService } from '@invento/owner-dashboard-data-access-supplier';
import { LocaleService } from '@invento/shared-util-i18n';

describe('E2E Journey: Procurement & Supplier Quote Workflow', () => {
  let router: Router;

  // Suppliers state mock
  let suppliersStateMock: {
    suppliers: ReturnType<typeof signal<Supplier[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    total: ReturnType<typeof signal<number>>;
    page: ReturnType<typeof signal<number>>;
    limit: ReturnType<typeof signal<number>>;
    totalPages: ReturnType<typeof signal<number>>;
    overallTotal: ReturnType<typeof signal<number>>;
    overallActive: ReturnType<typeof signal<number>>;
    overallInactive: ReturnType<typeof signal<number>>;
    atCapacity: ReturnType<typeof signal<boolean>>;
    maxSuppliers: number;
    hasItems: ReturnType<typeof signal<boolean>>;
    loadSuppliers: ReturnType<typeof vi.fn>;
    loadKpis: ReturnType<typeof vi.fn>;
    deleteSupplier: ReturnType<typeof vi.fn>;
    setPage: ReturnType<typeof vi.fn>;
    setLimit: ReturnType<typeof vi.fn>;
    toggleActive: ReturnType<typeof vi.fn>;
  };

  // Purchase requests state mock
  let purchaseRequestsStateMock: {
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
    mailboxStatus: ReturnType<typeof signal<MailboxStatus | null>>;
    mailboxConfigured: ReturnType<typeof signal<boolean>>;
    kpis: ReturnType<typeof signal<unknown>>;
    loadRequests: ReturnType<typeof vi.fn>;
    loadKpis: ReturnType<typeof vi.fn>;
    loadMailbox: ReturnType<typeof vi.fn>;
    checkMailboxStatus: ReturnType<typeof vi.fn>;
    createRequest: ReturnType<typeof vi.fn>;
    deleteRequest: ReturnType<typeof vi.fn>;
    syncMailbox: ReturnType<typeof vi.fn>;
    connectMailbox: ReturnType<typeof vi.fn>;
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

  const initialSuppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'Al-Ahram Hardware Supplies',
      contactEmail: 'sales@alahram-hardware.com',
      phone: '+201011223344',
      leadTimeDays: 7,
      isActive: true,
      notes: 'Premium supplier for cables and power adapters',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const initialPurchaseRequests: PurchaseRequestDetail[] = [
    {
      id: 'pr-101',
      productId: 'prod-1',
      variantId: 'var-1',
      productTitle: 'Galaxy Ultra Pro 5G',
      variantLabel: '256GB',
      quantity: 50,
      neededWithinDays: 10,
      subject: 'Restocking quote request',
      body: 'Please provide quotation for 50 units',
      note: 'Urgent restocking before Black Friday',
      status: 'sent',
      draftStatus: 'ai',
      offerCount: 1,
      receivedCount: 1,
      sentAt: '2026-09-20T10:00:00Z',
      confirmedAt: null,
      confirmedOfferId: null,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-21T11:00:00Z',
      offers: [
        {
          id: 'off-1',
          supplierId: 'sup-1',
          supplierName: 'Al-Ahram Hardware Supplies',
          supplierEmail: 'sales@alahram-hardware.com',
          unitAmount: 2750000,
          totalAmount: 137500000,
          quantity: 50,
          deliveryDays: 5,
          notes: 'Special discount applied for bulk order',
          rawReply: null,
          extractionStatus: 'parsed',
          status: 'received',
          sentAt: '2026-09-20T10:00:00Z',
          repliedAt: '2026-09-21T11:00:00Z',
          decidedAt: null,
          rank: 1,
          isRecommended: true,
          isCheapest: true,
          isFastest: true,
          isLate: false,
          isWatched: false,
          createdAt: '2026-09-21T11:00:00Z',
        },
      ],
    },
  ];

  beforeEach(async () => {
    suppliersStateMock = {
      suppliers: signal<Supplier[]>(initialSuppliers),
      loading: signal(false),
      error: signal(null),
      total: signal(1),
      page: signal(1),
      limit: signal(10),
      totalPages: signal(1),
      overallTotal: signal(1),
      overallActive: signal(1),
      overallInactive: signal(0),
      atCapacity: signal(false),
      maxSuppliers: 100,
      hasItems: signal(true),
      loadSuppliers: vi.fn(),
      loadKpis: vi.fn(),
      deleteSupplier: vi.fn(),
      setPage: vi.fn(),
      setLimit: vi.fn(),
      toggleActive: vi.fn(),
    };

    const mockMailbox: MailboxStatus = {
      isSupported: true,
      isConnected: true,
      provider: 'gmail',
      accountEmail: 'procurement@store.invento.ai',
      status: 'connected',
      scopes: [],
      isSyncing: false,
      lastSyncedAt: null,
      lastError: null,
      connectedAt: null,
    };

    purchaseRequestsStateMock = {
      requests: signal<PurchaseRequestDetail[]>(initialPurchaseRequests),
      total: signal(1),
      page: signal(1),
      limit: signal(10),
      totalPages: signal(1),
      loading: signal(false),
      error: signal(null),
      statusFilter: signal('all'),
      selected: signal<PurchaseRequestDetail | null>(null),
      detailLoading: signal(false),
      mailbox: signal<MailboxStatus | null>(mockMailbox),
      mailboxLoading: signal(false),
      mailboxStatus: signal<MailboxStatus | null>(mockMailbox),
      mailboxConfigured: signal(true),
      kpis: signal({
        totalRequests: 1,
        pendingOffers: 1,
        repliedOffers: 1,
        approvedRequests: 0,
      }),
      loadRequests: vi.fn(),
      loadKpis: vi.fn(),
      loadMailbox: vi.fn(),
      checkMailboxStatus: vi.fn(),
      createRequest: vi.fn(),
      deleteRequest: vi.fn(),
      syncMailbox: vi.fn(),
      connectMailbox: vi.fn(),
      openDetail: vi.fn(),
      closeDetail: vi.fn(),
      setPage: vi.fn(),
      setStatusFilter: vi.fn(),
    };

    productServiceMock = {
      getProducts: vi.fn().mockReturnValue(of({ items: [], total: 0 })),
    };

    supplierServiceMock = {
      list: vi.fn().mockReturnValue(of({ data: initialSuppliers, total: 1 })),
    };

    isRtlSignal = signal(false);
    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: isRtlSignal,
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Suppliers, PurchaseRequests],
      providers: [
        provideRouter([]),
        { provide: SuppliersState, useValue: suppliersStateMock },
        { provide: PurchaseRequestsState, useValue: purchaseRequestsStateMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: SupplierService, useValue: supplierServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('Step 1: opens Suppliers directory and triggers slide-over drawer to register a new vendor', () => {
    const fixture: ComponentFixture<Suppliers> = TestBed.createComponent(Suppliers);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(suppliersStateMock.loadSuppliers).toHaveBeenCalled();
    expect(component.suppliers().length).toBe(1);

    component.onAdd();
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()).toBeNull();

    component.onCloseForm();
    expect(component.isFormOpen()).toBe(false);
  });

  it('Step 2: selects existing vendor and opens edit sheet populated with contact information', () => {
    const fixture: ComponentFixture<Suppliers> = TestBed.createComponent(Suppliers);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.onEdit(initialSuppliers[0]);
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()?.name).toBe('Al-Ahram Hardware Supplies');
    expect(component.editing()?.leadTimeDays).toBe(7);
  });

  it('Step 3: opens Purchase Requests queue and verifies supplier offers count and details', () => {
    const fixture: ComponentFixture<PurchaseRequests> = TestBed.createComponent(PurchaseRequests);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(purchaseRequestsStateMock.loadRequests).toHaveBeenCalled();
    expect(component.requests().length).toBe(1);

    const pr = component.requests()[0];
    expect(pr.offers.length).toBe(1);
    expect(pr.offers[0].unitAmount).toBe(2750000);
    expect(pr.offers[0].deliveryDays).toBe(5);
  });

  it('Step 4: triggers new procurement request drawer flow', () => {
    const fixture: ComponentFixture<PurchaseRequests> = TestBed.createComponent(PurchaseRequests);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openCreate();
    expect(component.showCreate()).toBe(true);

    component.closeCreate();
    expect(component.showCreate()).toBe(false);
  });

  it('Step 5: adapts layout sheets dynamically for Right-to-Left (Arabic) and Left-to-Right (English)', () => {
    const fixture: ComponentFixture<Suppliers> = TestBed.createComponent(Suppliers);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Default LTR (English)
    isRtlSignal.set(false);
    expect(component['sheetSide']()).toBe('right');

    // RTL (Arabic)
    isRtlSignal.set(true);
    expect(component['sheetSide']()).toBe('left');
  });
});
