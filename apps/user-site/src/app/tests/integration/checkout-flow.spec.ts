import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Checkout } from '@invento/user-site-feature-checkout';
import { CartService } from '@invento/user-site-data-access-cart';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { OrdersDataService } from '@invento/user-site-data-access-order';
import { StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';
import { CurrencyPipe } from '@angular/common';

const MOCK_USER: User = {
  id: 'user-1',
  email: 'shopper@example.com',
  firstName: 'Amina',
  lastName: 'Khan',
  image: null,
  role: 'customer',
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Checkout Flow Integration Tests', () => {
  let fixture: ComponentFixture<Checkout>;
  let component: Checkout;
  let mockCartService: Partial<CartService>;
  let mockAuthService: Partial<AuthService>;
  let mockOrdersService: Partial<OrdersDataService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(async () => {
    mockCartService = {
      items: signal([
        {
          variantId: 'var-1',
          productId: 'oud-royal',
          productTitle: 'Oud Royal',
          quantity: 2,
          unitAmount: 150,
          currency: 'USD',
        },
      ]),
      itemCount: signal(2),
      currency: signal('USD'),
      subtotalAmount: signal(300),
      shippingFee: signal(15),
      totalAmount: signal(315),
      lastPlacedOrder: signal(null),
      prefilledCustomer: signal(null),
      placeOrder: vi.fn().mockReturnValue(of({ id: 'order-123', orderNumber: 'ORD-123' })),
      clearCart: vi.fn(),
      clearPrefill: vi.fn(),
      setPrefilledCustomer: vi.fn(),
      setLastPlacedOrder: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
    };

    mockAuthService = {
      currentUser: signal<User | null>(MOCK_USER),
      isAuthenticated: vi.fn().mockReturnValue(true),
    };

    mockOrdersService = {
      getMyOrders: vi.fn().mockReturnValue(of({ items: [], total: 0 })),
      getMyOrder: vi.fn().mockReturnValue(of(null)),
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
      imports: [Checkout],
      providers: [
        provideRouter([]),
        CurrencyPipe,
        { provide: CartService, useValue: mockCartService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OrdersDataService, useValue: mockOrdersService },
        { provide: StoreSlugService, useValue: mockStoreSlugService },
        { provide: LocaleService, useValue: mockLocaleService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'layali' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Checkout component and prefills authenticated customer details', () => {
    expect(component).toBeTruthy();
    expect(component.checkoutForm.get('firstName')?.value).toBe('Amina');
    expect(component.checkoutForm.get('lastName')?.value).toBe('Khan');
    expect(component.checkoutForm.get('email')?.value).toBe('shopper@example.com');
  });

  it('validates step 1 and step 2 fields correctly', () => {
    // Fill required step 1 details
    component.checkoutForm.patchValue({
      firstName: 'Amina',
      lastName: 'Khan',
      contactPhone: '+201234567890',
    });
    expect(component.isStep1Valid()).toBe(true);

    // Step 2 address line1 and city
    expect(component.isStep2Valid()).toBe(false);
    component.checkoutForm.patchValue({
      line1: '123 Nile Corniche',
      city: 'Cairo',
    });
    expect(component.isStep2Valid()).toBe(true);
  });

  it('applies and removes promo codes with status tracking', () => {
    expect(component.isPromoApplied()).toBe(false);

    component.onPromoInputChange('WELCOME10');
    component.applyPromoCode();
    expect(component.isPromoApplied()).toBe(true);

    component.removePromoCode();
    expect(component.isPromoApplied()).toBe(false);
    expect(component.promoCodeInput()).toBe('');
  });

  it('toggles mobile summary drawer state', () => {
    expect(component.isMobileSummaryOpen()).toBe(false);
    component.toggleMobileSummary();
    expect(component.isMobileSummaryOpen()).toBe(true);
    component.toggleMobileSummary();
    expect(component.isMobileSummaryOpen()).toBe(false);
  });
});
