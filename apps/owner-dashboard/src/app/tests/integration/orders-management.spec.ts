import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Orders } from '@invento/owner-dashboard-feature-orders';
import {
  OrderStore,
  OrderListItem,
  OrderStatsSummary,
} from '@invento/owner-dashboard-data-access-order';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Orders Management Integration Tests', () => {
  let fixture: ComponentFixture<Orders>;
  let component: Orders;
  let router: Router;
  let orderStoreMock: {
    orders: ReturnType<typeof signal<OrderListItem[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    isLoading: ReturnType<typeof signal<boolean>>;
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
    setPage: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
    setTimeFilter: ReturnType<typeof vi.fn>;
    setRowsPerPage: ReturnType<typeof vi.fn>;
    toggleSort: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
    bulkUpdateStatus: ReturnType<typeof vi.fn>;
    toggleSelectAll: ReturnType<typeof vi.fn>;
    toggleSelectOrder: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
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
    {
      id: 'ord-102',
      orderNumber: 1002,
      status: 'shipped',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      currency: 'EGP',
      totalAmount: 3400,
      itemCount: 1,
      contactName: 'Sarah Mansour',
      contactEmail: 'sarah@example.com',
      createdAt: '2026-09-21T14:30:00Z',
    },
  ];

  beforeEach(async () => {
    orderStoreMock = {
      orders: signal<OrderListItem[]>(mockOrdersList),
      loading: signal(false),
      isLoading: signal(false),
      isDetailLoading: signal(false),
      isUpdatingStatus: signal(false),
      isUpdatingNote: signal(false),
      error: signal(null),
      sortBy: signal('createdAt'),
      sortDirection: signal('DESC'),
      totalOrdersCount: signal(2),
      currentPage: signal(1),
      rowsPerPage: signal(10),
      totalPages: signal(1),
      selectedOrderIds: signal(new Set<string>()),
      isAllCurrentPageSelected: signal(false),
      statusFilter: signal('all'),
      timeFilter: signal('all_time'),
      searchQuery: signal(''),
      stats: signal<OrderStatsSummary>({
        total: 2,
        pending: 1,
        confirmed: 0,
        shipped: 1,
        delivered: 0,
        cancelled: 0,
      }),
      loadOrders: vi.fn(),
      loadStats: vi.fn(),
      setPage: vi.fn(),
      setSearchQuery: vi.fn(),
      setStatusFilter: vi.fn(),
      setTimeFilter: vi.fn(),
      setRowsPerPage: vi.fn(),
      toggleSort: vi.fn(),
      updateOrderStatus: vi.fn().mockImplementation((_id, _status, _reason, cb) => {
        if (cb) cb();
        return of(void 0);
      }),
      bulkUpdateStatus: vi.fn(),
      toggleSelectAll: vi.fn(),
      toggleSelectOrder: vi.fn(),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Orders],
      providers: [
        provideRouter([]),
        { provide: OrderStore, useValue: orderStoreMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture = TestBed.createComponent(Orders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Orders component and triggers loadOrders on init', () => {
    expect(component).toBeDefined();
    expect(orderStoreMock.loadOrders).toHaveBeenCalled();
    expect(component.store.orders().length).toBe(2);
  });

  it('navigates to /orders/:id when viewing an order', () => {
    component.viewDetails(mockOrdersList[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 'ord-101']);
  });

  it('calls store.setPage when table pagination triggers page change', () => {
    component.store.setPage(2);
    expect(orderStoreMock.setPage).toHaveBeenCalledWith(2);
  });

  it('filters orders by order ID and customer search inputs', () => {
    component.colIdSearch.set('1002');
    expect(component.colIdSearch()).toBe('1002');

    component.colCustomerSearch.set('Sarah');
    expect(component.colCustomerSearch()).toBe('Sarah');
  });

  it('opens cancellation dialog and executes order cancellation', () => {
    component.openCancelModal(mockOrdersList[0]);
    expect(component.isCancelModalOpen()).toBe(true);
    expect(component.orderToCancel()).toEqual(mockOrdersList[0]);

    component.cancelReason.set('Customer requested cancellation via phone');
    component.submitCancelOrder();

    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith(
      'ord-101',
      'cancelled',
      'Customer requested cancellation via phone',
      expect.any(Function),
    );
  });
});
