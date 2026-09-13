import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import {
  AccountSettingsProfile,
  AccountSettingsSecurity,
} from '@invento/user-site-feature-account-settings';
import { Orders } from '@invento/user-site-feature-orders';
import { OrdersDataService, OrderSummaryItem } from '@invento/user-site-data-access-order';
import { CartService } from '@invento/user-site-data-access-cart';
import { StoreSlugService } from '@invento/user-site-data-access-store';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';

const MOCK_USER: User = {
  id: 'cust-101',
  email: 'tariq.mansoor@example.com',
  firstName: 'Tariq',
  lastName: 'Mansoor',
  image: null,
  role: 'customer',
  isEmailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const MOCK_ORDER_1: OrderSummaryItem = {
  id: 'order-101',
  orderNumber: 101,
  status: 'shipped',
  paymentStatus: 'paid',
  paymentMethod: 'cod',
  currency: 'USD',
  totalAmount: 235,
  itemCount: 1,
  contactName: 'Tariq Mansoor',
  contactEmail: 'tariq.mansoor@example.com',
  createdAt: '2026-09-01T10:00:00Z',
};

const MOCK_ORDER_2: OrderSummaryItem = {
  id: 'order-102',
  orderNumber: 102,
  status: 'delivered',
  paymentStatus: 'paid',
  paymentMethod: 'cod',
  currency: 'USD',
  totalAmount: 195,
  itemCount: 2,
  contactName: 'Tariq Mansoor',
  contactEmail: 'tariq.mansoor@example.com',
  createdAt: '2026-08-15T12:00:00Z',
};

describe('E2E Simulated Customer Journey: Account & Orders Lifecycle', () => {
  let router: Router;
  let mockAuthService: Partial<AuthService>;
  let mockOrdersService: Partial<OrdersDataService>;
  let mockCartService: Partial<CartService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(() => {
    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockAuthService = {
      currentUser: signal<User | null>(MOCK_USER),
      isLoggedIn: signal(true),
      changePassword: vi.fn().mockReturnValue(of({ success: true })),
      logout: vi.fn(),
    };

    const detailsMap = new Map<
      number,
      import('@invento/user-site-data-access-order').OrderDetail
    >();

    mockOrdersService = {
      orders: signal<OrderSummaryItem[]>([MOCK_ORDER_1, MOCK_ORDER_2]),
      filteredOrders: signal<OrderSummaryItem[]>([MOCK_ORDER_1, MOCK_ORDER_2]),
      pagedOrders: signal<OrderSummaryItem[]>([MOCK_ORDER_1, MOCK_ORDER_2]),
      isLoading: signal(false),
      error: signal(null),
      isUnauthorized: signal(false),
      selectedFilter: signal('all'),
      searchQuery: signal(''),
      statusCounts: signal({
        all: 2,
        pending: 0,
        confirmed: 0,
        shipped: 1,
        delivered: 1,
        cancelled: 0,
      }),
      totalSpent: signal(430),
      currency: signal('USD'),
      clientPage: signal(1),
      clientTotalPages: signal(1),
      clientPageSize: 5,
      orderDetailsMap: signal(detailsMap),
      loadingDetails: signal(new Set()),
      isCancelling: signal(null),
      activeStoreSlug: signal('layali'),
      loadOrders: vi.fn(),
      loadOrderDetails: vi.fn().mockResolvedValue(null),
      cancelOrder: vi.fn().mockResolvedValue({ success: true }),
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

    mockCartService = {
      itemCount: signal(0),
      items: signal([]),
      addItem: vi.fn(),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };
  });

  it('manages profile settings, updates credentials and navigates orders smoothly', async () => {
    // ----------------------------------------------------
    // STAGE 1: Profile View & Password Change Modal
    // ----------------------------------------------------
    const profileFixture = TestBed.configureTestingModule({
      imports: [AccountSettingsProfile],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).createComponent(AccountSettingsProfile);

    profileFixture.detectChanges();
    const profileComponent = profileFixture.componentInstance;

    expect(profileComponent).toBeTruthy();
    expect(profileComponent.initials()).toBe('TM');

    // Customer opens password modal from profile and changes password
    profileComponent.openPasswordModal();
    expect(profileComponent.isPasswordModalOpen()).toBe(true);

    profileComponent.passwordForm.setValue({
      currentPassword: 'OldPassword123!',
      newPassword: 'SuperSecurePassword2026!',
      confirmPassword: 'SuperSecurePassword2026!',
    });

    expect(profileComponent.hasMinLength()).toBe(true);
    expect(profileComponent.hasLetterAndNumber()).toBe(true);
    expect(profileComponent.passwordsMatch()).toBe(true);

    profileComponent.savePassword();
    expect(mockAuthService.changePassword).toHaveBeenCalledWith({
      oldPassword: 'OldPassword123!',
      newPassword: 'SuperSecurePassword2026!',
      confirmPassword: 'SuperSecurePassword2026!',
    });
    expect(profileComponent.isPasswordModalOpen()).toBe(false);

    profileFixture.destroy();

    // ----------------------------------------------------
    // STAGE 2: Dedicated Security Settings Component
    // ----------------------------------------------------
    TestBed.resetTestingModule();
    const securityFixture = TestBed.configureTestingModule({
      imports: [AccountSettingsSecurity],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).createComponent(AccountSettingsSecurity);

    securityFixture.detectChanges();
    const securityComponent = securityFixture.componentInstance;

    expect(securityComponent).toBeTruthy();
    securityComponent.form.setValue({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewValidPassword123!',
      confirmPassword: 'NewValidPassword123!',
    });

    expect(securityComponent.form.valid).toBe(true);
    expect(securityComponent.passwordsMatch()).toBe(true);

    securityFixture.destroy();

    // ----------------------------------------------------
    // STAGE 3: Orders Overview, Filtering & Search
    // ----------------------------------------------------
    TestBed.resetTestingModule();
    const ordersFixture = TestBed.configureTestingModule({
      imports: [Orders],
      providers: [
        provideRouter([]),
        { provide: OrdersDataService, useValue: mockOrdersService },
        { provide: CartService, useValue: mockCartService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).createComponent(Orders);

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    ordersFixture.detectChanges();
    const ordersComponent = ordersFixture.componentInstance;

    expect(ordersComponent).toBeTruthy();
    expect(mockOrdersService.loadOrders).toHaveBeenCalledWith('layali', 1, expect.any(Number));

    // Customer applies filter for "shipped" orders
    const ordersInternal = ordersComponent as unknown as {
      ordersService: Partial<OrdersDataService>;
      resetFilters: () => void;
    };
    ordersInternal.ordersService.setFilter?.('shipped');
    expect(mockOrdersService.setFilter).toHaveBeenCalledWith('shipped');

    // Customer searches for "Amber"
    ordersInternal.ordersService.setSearchQuery?.('Amber');
    expect(mockOrdersService.setSearchQuery).toHaveBeenCalledWith('Amber');

    // Customer resets filters
    ordersInternal.resetFilters();
    expect(mockOrdersService.setFilter).toHaveBeenCalledWith('all');
    expect(mockOrdersService.setSearchQuery).toHaveBeenCalledWith('');

    ordersFixture.destroy();
  });
});
