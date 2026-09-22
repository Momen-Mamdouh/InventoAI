import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { OrderDetails } from '@invento/owner-dashboard-feature-orders';
import { OrderStore, OrderDetail } from '@invento/owner-dashboard-data-access-order';
import { LocaleService } from '@invento/shared-util-i18n';
import { BreadcrumbService } from '@invento/owner-dashboard-util-breadcrumb';

describe('Order Details Canvas Integration Tests', () => {
  let fixture: ComponentFixture<OrderDetails>;
  let component: OrderDetails;
  let orderStoreMock: {
    selectedOrder: ReturnType<typeof signal<OrderDetail | null>>;
    loadingDetails: ReturnType<typeof signal<boolean>>;
    isDetailLoading: ReturnType<typeof signal<boolean>>;
    isUpdatingStatus: ReturnType<typeof signal<boolean>>;
    isUpdatingNote: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    loadOrderDetail: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
    updateOrderNote: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };
  let breadcrumbServiceMock: {
    setLabel: ReturnType<typeof vi.fn>;
  };

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
    customerNote: 'Please call before delivery',
    internalNote: 'High priority customer',
    cancelledAt: null,
    cancelReason: null,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        productTitle: 'Smart Fitness Tracker',
        productSlug: 'smart-fitness-tracker',
        productImageUrl: 'https://example.com/tracker.jpg',
        variantOptions: { Color: 'Black' },
        sku: 'TRK-BLK',
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
      selectedOrder: signal<OrderDetail | null>(mockOrderDetail),
      loadingDetails: signal(false),
      isDetailLoading: signal(false),
      isUpdatingStatus: signal(false),
      isUpdatingNote: signal(false),
      error: signal(null),
      loadOrderDetail: vi.fn(),
      updateOrderStatus: vi.fn().mockImplementation((_id, _status, _reason, cb) => {
        if (cb) cb();
        return of(void 0);
      }),
      updateOrderNote: vi.fn().mockReturnValue(of(void 0)),
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
      imports: [OrderDetails],
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

    fixture = TestBed.createComponent(OrderDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates OrderDetails component and loads order by id', () => {
    expect(component).toBeDefined();
    expect(orderStoreMock.loadOrderDetail).toHaveBeenCalledWith('ord-101');
    expect(component.store.selectedOrder()?.orderNumber).toBe(1001);
  });

  it('transitions order fulfillment status through store action', () => {
    component.confirmOrder();
    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith('ord-101', 'confirmed');

    component.shipOrder();
    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith('ord-101', 'shipped');

    component.deliverOrder();
    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith('ord-101', 'delivered');
  });

  it('edits and saves private merchant internal note', () => {
    component.internalNoteDraft.set('Updated note: delivery scheduled for tomorrow');
    component.saveInternalNote();

    expect(orderStoreMock.updateOrderNote).toHaveBeenCalledWith(
      'ord-101',
      'Updated note: delivery scheduled for tomorrow',
    );
  });

  it('opens cancellation dialog and cancels order with reason', () => {
    component.openCancelModal();
    expect(component.isCancelModalOpen()).toBe(true);

    component.cancelReason.set('Out of stock');
    component.submitCancelOrder();

    expect(orderStoreMock.updateOrderStatus).toHaveBeenCalledWith(
      'ord-101',
      'cancelled',
      'Out of stock',
      expect.any(Function),
    );
    expect(component.isCancelModalOpen()).toBe(false);
  });
});
