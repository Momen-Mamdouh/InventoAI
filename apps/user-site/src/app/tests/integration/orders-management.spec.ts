import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Orders } from '@invento/user-site-feature-orders';
import { OrdersDataService, OrderSummaryItem } from '@invento/user-site-data-access-order';
import { StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';
import { CartService } from '@invento/user-site-data-access-cart';

const MOCK_ORDER_SUMMARY: OrderSummaryItem = {
  id: 'order-1',
  orderNumber: 98765,
  status: 'shipped',
  paymentStatus: 'paid',
  paymentMethod: 'cod',
  currency: 'USD',
  totalAmount: 195,
  itemCount: 1,
  contactName: 'Tariq Mansoor',
  contactEmail: 'tariq@example.com',
  createdAt: new Date().toISOString(),
};

interface OrdersInternalAccess {
  resetFilters: () => void;
  reload: () => void;
  onPageChange: (page: number) => void;
  goToLogin: () => void;
}

describe('Orders Management Integration Tests', () => {
  let fixture: ComponentFixture<Orders>;
  let component: Orders;
  let mockOrdersService: Partial<OrdersDataService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;
  let router: Router;

  beforeEach(async () => {
    mockOrdersService = {
      orders: signal<OrderSummaryItem[]>([MOCK_ORDER_SUMMARY]),
      filteredOrders: signal<OrderSummaryItem[]>([MOCK_ORDER_SUMMARY]),
      pagedOrders: signal<OrderSummaryItem[]>([MOCK_ORDER_SUMMARY]),
      isLoading: signal(false),
      error: signal(null),
      isUnauthorized: signal(false),
      selectedFilter: signal('all'),
      searchQuery: signal(''),
      statusCounts: signal({
        all: 1,
        pending: 0,
        confirmed: 0,
        shipped: 1,
        delivered: 0,
        cancelled: 0,
      }),
      totalSpent: signal(195),
      currency: signal('USD'),
      clientPage: signal(1),
      clientTotalPages: signal(1),
      clientPageSize: 5,
      orderDetailsMap: signal(new Map()),
      loadingDetails: signal(new Set()),
      isCancelling: signal(null),
      activeStoreSlug: signal('layali'),
      loadOrders: vi.fn(),
      loadOrderDetails: vi.fn(),
      cancelOrder: vi.fn(),
      setFilter: vi.fn(),
      setSearchQuery: vi.fn(),
      setClientPage: vi.fn(),
      getStatusConfig: vi.fn().mockReturnValue({
        label: 'orders.status.shipped',
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
        dotClass: 'bg-primary animate-pulse',
        icon: 'lucideTruck',
      }),
    };

    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    const mockCartService = {
      itemCount: signal(0),
      items: signal([]),
    };

    await TestBed.configureTestingModule({
      imports: [Orders],
      providers: [
        provideRouter([]),
        { provide: OrdersDataService, useValue: mockOrdersService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(Orders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Orders component and triggers loadOrders with slug', () => {
    expect(component).toBeTruthy();
    expect(mockOrdersService.loadOrders).toHaveBeenCalledWith('layali', 1, expect.any(Number));
  });

  it('resets status filter and search query when resetFilters() is called', () => {
    (component as unknown as OrdersInternalAccess).resetFilters();
    expect(mockOrdersService.setFilter).toHaveBeenCalledWith('all');
    expect(mockOrdersService.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('reloads orders when reload() is invoked', () => {
    (component as unknown as OrdersInternalAccess).reload();
    expect(mockOrdersService.loadOrders).toHaveBeenCalledWith('layali', 1, expect.any(Number));
  });

  it('updates page number on onPageChange()', () => {
    (component as unknown as OrdersInternalAccess).onPageChange(2);
    expect(mockOrdersService.setClientPage).toHaveBeenCalledWith(2);
  });

  it('navigates to customer login when goToLogin() is triggered', () => {
    (component as unknown as OrdersInternalAccess).goToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/', 'layali', 'auth', 'login']);
  });
});
