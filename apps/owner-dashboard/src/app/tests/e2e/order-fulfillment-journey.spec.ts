import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Orders, OrderDetails } from '@invento/owner-dashboard-feature-orders';
import {
  OrderStore,
  OrderListItem,
  OrderDetail,
  OrderStatsSummary,
} from '@invento/owner-dashboard-data-access-order';
import { LocaleService } from '@invento/shared-util-i18n';
import { BreadcrumbService } from '@invento/owner-dashboard-util-breadcrumb';

describe('E2E Journey: Order Fulfillment and Lifecycle Management', () => {
  let router: Router;

  let orderStoreMock: {
    orders: ReturnType<typeof signal<OrderListItem[]>>;
    selectedOrder: ReturnType<typeof signal<OrderDetail | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    loadingDetails: ReturnType<typeof signal<boolean>>;
    isDetailLoading: ReturnType<typeof signal<boolean>>;
    isUpdatingStatus: ReturnType<typeof signal<boolean>>;
    isUpdatingNote: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    sortBy: ReturnType<typeof signal<string>>;
    sortDirection: ReturnType<typeof signal<string>>;
    totalOrdersCount: ReturnType<typeof signal<number>>;
    currentPage: ReturnType<typeof signal<number>>;
    rowsPerPage: ReturnType<typeof signal<number>>;
    totalPages: ReturnType<typeof signal<number>>;
    selectedOrderIds: ReturnType<typeof signal<Set<string>>>;
    isAllCurrentPageSelected: ReturnType<typeof signal<boolean>>;
    statusFilter: ReturnType<typeof signal<string>>;
    timeFilter: ReturnType<typeof signal<string>>;
    searchQuery: ReturnType<typeof signal<string>>;
    stats: ReturnType<typeof signal<OrderStatsSummary>>;
    loadOrders: ReturnType<typeof vi.fn>;
    loadStats: ReturnType<typeof vi.fn>;
    loadOrderDetail: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
    updateOrderNote: ReturnType<typeof vi.fn>;
    setPage: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
    setTimeFilter: ReturnType<typeof vi.fn>;
    setRowsPerPage: ReturnType<typeof vi.fn>;
    toggleSort: ReturnType<typeof vi.fn>;
    bulkUpdateStatus: ReturnType<typeof vi.fn>;
    toggleSelectAll: ReturnType<typeof vi.fn>;
    toggleSelectOrder: ReturnType<typeof vi.fn>;
  };

  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  let breadcrumbServiceMock: {
    setLabel: ReturnType<typeof vi.fn>;
  };

  const mockOrdersList: OrderListItem[] = [
    {
      id: 'ord-101',
      orderNumber: 1001,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'cod',
      currency: 'EGP',
      totalAmount: 1250,
      itemCount: 2,
      contactName: 'Nour El-Din',
      contactEmail: 'nour@example.com',
      createdAt: '2026-09-20T10:00:00Z',
    },
  ];

  const mockOrderDetail: OrderDetail = {
    id: 'ord-101',
    orderNumber: 1001,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'cod',
    currency: 'EGP',
    totalAmount: 125000,
    subtotalAmount: 120000,
    shippingFee: 5000,
    contactName: 'Nour El-Din',
    contactEmail: 'nour@example.com',
    contactPhone: '+201012345678',
    shippingAddress: {
      line1: '14 Al-Ahram Street',
      city: 'Giza',
      country: 'EG',
    },
    customerNote: 'Please ring the bell',
    internalNote: 'Standard handling',
    cancelledAt: null,
    cancelReason: null,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        productTitle: 'Galaxy Ultra Pro 5G',
        productSlug: 'galaxy-ultra-pro-5g',
        productImageUrl: 'https://example.com/phone.jpg',
        variantOptions: { Storage: '256GB' },
        sku: 'GLX-5G-256',
        unitAmount: 60000,
        quantity: 2,
        lineTotalAmount: 120000,
      },
    ],
    userId: 'usr-1',
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  };

  beforeEach(async () => {
    orderStoreMock = {
      orders: signal<OrderListItem[]>(mockOrdersList),
      selectedOrder: signal<OrderDetail | null>(mockOrderDetail),
      loading: signal(false),
      isLoading: signal(false),
      loadingDetails: signal(false),
      isDetailLoading: signal(false),
      isUpdatingStatus: signal(false),
      isUpdatingNote: signal(false),
      error: signal(null),
      sortBy: signal('createdAt'),
      sortDirection: signal('DESC'),
      totalOrdersCount: signal(1),
      currentPage: signal(1),
      rowsPerPage: signal(10),
      totalPages: signal(1),
      selectedOrderIds: signal(new Set<string>()),
      isAllCurrentPageSelected: signal(false),
      statusFilter: signal('all'),
      timeFilter: signal('all_time'),
      searchQuery: signal(''),
      stats: signal<OrderStatsSummary>({
        total: 1,
        pending: 1,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }),
      loadOrders: vi.fn(),
      loadStats: vi.fn(),
      loadOrderDetail: vi.fn(),
      updateOrderStatus: vi.fn().mockImplementation((_id, _status, _reason, cb) => {
        if (cb) {
          cb();
        }
        return of(void 0);
      }),
      updateOrderNote: vi.fn().mockReturnValue(of(void 0)),
      setPage: vi.fn(),
      setSearchQuery: vi.fn(),
      setStatusFilter: vi.fn(),
      setTimeFilter: vi.fn(),
      setRowsPerPage: vi.fn(),
      toggleSort: vi.fn(),
      bulkUpdateStatus: vi.fn(),
      toggleSelectAll: vi.fn(),
      toggleSelectOrder: vi.fn(),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    breadcrumbServiceMock = {
      setLabel: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Orders, OrderDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'ord-101' : null) } },
            paramMap: of({ get: (k: string) => (k === 'id' ? 'ord-101' : null) }),
          },
        },
        { provide: OrderStore, useValue: orderStoreMock },
        { provide: LocaleService, useValue: localeServiceMock },
        { provide: BreadcrumbService, useValue: breadcrumbServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('Step 1: loads orders table and filters by customer name and order ID', () => {
    const fixture: ComponentFixture<Orders> = TestBed.createComponent(Orders);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(orderStoreMock.loadOrders).toHaveBeenCalled();
    expect(component.store.orders().length).toBe(1);

    component.colCustomerSearch.set('Nour');
    expect(component.colCustomerSearch()).toBe('Nour');
    expect(component.displayedOrders().length).toBe(1);
  });

  it('Step 2: navigates from orders table to order details canvas', () => {
    const fixture: ComponentFixture<Orders> = TestBed.createComponent(Orders);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.viewDetails(mockOrdersList[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 'ord-101']);
  });

  it('Step 3: loads order details and executes lifecycle transitions (pending -> confirmed -> shipped)', () => {
    const fixture: ComponentFixture<OrderDetails> = TestBed.createComponent(OrderDetails);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(orderStoreMock.loadOrderDetail).toHaveBeenCalledWith('ord-101');
    expect(component.store.selectedOrder()?.orderNumber).toBe(1001);

    component.confirmOrder();
    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith('ord-101', 'confirmed');

    component.shipOrder();
    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith('ord-101', 'shipped');

    component.deliverOrder();
    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith('ord-101', 'delivered');
  });

  it('Step 4: drafts and commits merchant private note with persistent state', () => {
    const fixture: ComponentFixture<OrderDetails> = TestBed.createComponent(OrderDetails);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.internalNoteDraft.set('Customer requested express dispatch by courier');
    component.saveInternalNote();

    expect(orderStoreMock.updateOrderNote).toHaveBeenCalledWith(
      'ord-101',
      'Customer requested express dispatch by courier',
    );
  });

  it('Step 5: handles order cancellation workflow with reason dialog', () => {
    const fixture: ComponentFixture<OrderDetails> = TestBed.createComponent(OrderDetails);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openCancelModal();
    expect(component.isCancelModalOpen()).toBe(true);

    component.cancelReason.set('Customer cancelled request before courier pickup');
    component.submitCancelOrder();

    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith(
      'ord-101',
      'cancelled',
      'Customer cancelled request before courier pickup',
      expect.any(Function),
    );
    expect(component.isCancelModalOpen()).toBe(false);
  });
});
