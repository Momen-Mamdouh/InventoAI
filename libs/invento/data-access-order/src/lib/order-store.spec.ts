// @vitest-environment jsdom
import './test-setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderStore } from './order-store';
import { OrderService } from './order.service';
import { OrderListItem, OrderDetail, OrdersListResponse } from './order.model';

describe('OrderStore', () => {
  let store: OrderStore;
  let orderServiceMock: {
    getOrders: ReturnType<typeof vi.fn>;
    getOrderById: ReturnType<typeof vi.fn>;
    updateOrderStatus: ReturnType<typeof vi.fn>;
    updateOrderNote: ReturnType<typeof vi.fn>;
  };

  const sampleOrder: OrderListItem = {
    id: 'ord-1',
    orderNumber: 1,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'cod',
    currency: 'EGP',
    totalAmount: 10000,
    itemCount: 1,
    contactName: 'Alice',
    contactEmail: 'alice@test.com',
    createdAt: '2026-08-15T09:00:00Z',
  };

  const sampleDetail: OrderDetail = {
    ...sampleOrder,
    subtotalAmount: 9000,
    shippingFee: 1000,
    contactPhone: '+2010000000',
    shippingAddress: { line1: 'Street 1', city: 'Cairo', country: 'EG' },
    customerNote: null,
    cancelledAt: null,
    cancelReason: null,
    items: [],
    internalNote: 'Private note',
    userId: 'user-1',
    updatedAt: '2026-08-15T09:10:00Z',
  };

  const sampleListResponse: OrdersListResponse = {
    items: [sampleOrder],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    orderServiceMock = {
      getOrders: vi.fn().mockReturnValue(of(sampleListResponse)),
      getOrderById: vi.fn().mockReturnValue(of(sampleDetail)),
      updateOrderStatus: vi.fn().mockReturnValue(of({ ...sampleDetail, status: 'confirmed' })),
      updateOrderNote: vi.fn().mockReturnValue(of({ ...sampleDetail, internalNote: 'New note' })),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [OrderStore, { provide: OrderService, useValue: orderServiceMock }],
    });

    store = TestBed.inject(OrderStore);
  });

  it('should initialize with default states', () => {
    expect(store.orders().length).toBe(0);
    expect(store.currentPage()).toBe(1);
    expect(store.rowsPerPage()).toBe(10);
    expect(store.sortBy()).toBe('createdAt');
    expect(store.sortDirection()).toBe('DESC');
    expect(store.statusFilter()).toBe('all');
    expect(store.timeFilter()).toBe('all_time');
  });

  it('should load orders and update signals', () => {
    store.loadOrders();
    expect(orderServiceMock.getOrders).toHaveBeenCalled();
    expect(store.orders().length).toBe(1);
    expect(store.totalOrdersCount()).toBe(1);
    expect(store.totalPages()).toBe(1);
    expect(store.isLoading()).toBe(false);
  });

  it('should toggle sort direction and sort column', () => {
    // Initial is createdAt DESC
    store.toggleSort('createdAt');
    expect(store.sortBy()).toBe('createdAt');
    expect(store.sortDirection()).toBe('ASC');

    // Switch to totalAmount -> should default to DESC
    store.toggleSort('totalAmount');
    expect(store.sortBy()).toBe('totalAmount');
    expect(store.sortDirection()).toBe('DESC');

    // Toggle totalAmount -> should flip to ASC
    store.toggleSort('totalAmount');
    expect(store.sortBy()).toBe('totalAmount');
    expect(store.sortDirection()).toBe('ASC');
  });

  it('should load order detail', () => {
    store.loadOrderDetail('ord-1');
    expect(orderServiceMock.getOrderById).toHaveBeenCalledWith('ord-1');
    expect(store.selectedOrder()?.id).toBe('ord-1');
    expect(store.isDetailLoading()).toBe(false);
  });

  it('should update single order status along state machine', () => {
    store.orders.set([sampleOrder]);
    store.selectedOrder.set(sampleDetail);

    store.updateOrderStatus('ord-1', 'confirmed');
    expect(orderServiceMock.updateOrderStatus).toHaveBeenCalledWith('ord-1', {
      status: 'confirmed',
    });
    expect(store.orders()[0].status).toBe('confirmed');
    expect(store.selectedOrder()?.status).toBe('confirmed');
  });

  it('should save internal note', () => {
    store.selectedOrder.set(sampleDetail);
    store.updateOrderNote('ord-1', 'New note');
    expect(orderServiceMock.updateOrderNote).toHaveBeenCalledWith('ord-1', 'New note');
    expect(store.selectedOrder()?.internalNote).toBe('New note');
  });

  it('should handle bulk status updates only for eligible orders', () => {
    const pendingOrder: OrderListItem = { ...sampleOrder, id: 'ord-1', status: 'pending' };
    const shippedOrder: OrderListItem = { ...sampleOrder, id: 'ord-2', status: 'shipped' };

    store.orders.set([pendingOrder, shippedOrder]);
    store.selectedOrderIds.set(new Set(['ord-1', 'ord-2']));

    // Target status 'confirmed': only ord-1 (pending) is eligible
    store.bulkUpdateStatus('confirmed');
    expect(orderServiceMock.updateOrderStatus).toHaveBeenCalledTimes(1);
    expect(orderServiceMock.updateOrderStatus).toHaveBeenCalledWith('ord-1', {
      status: 'confirmed',
    });
  });

  it('should pass cancellation reason to updateOrderStatus when cancelling', () => {
    store.orders.set([sampleOrder]);
    store.selectedOrder.set(sampleDetail);

    store.updateOrderStatus('ord-1', 'cancelled', 'Customer changed their mind');
    expect(orderServiceMock.updateOrderStatus).toHaveBeenCalledWith('ord-1', {
      status: 'cancelled',
      reason: 'Customer changed their mind',
    });
  });

  it('should calculate timeframe filter dates and pass them to getOrders', () => {
    store.setTimeFilter('today');
    expect(orderServiceMock.getOrders).toHaveBeenCalled();
    const lastCallArgs = orderServiceMock.getOrders.mock.calls.at(-1)?.[0];
    expect(lastCallArgs?.fromDate).toBeTruthy();
    expect(lastCallArgs?.toDate).toBeTruthy();
  });

  it('should manage row selection and selection toggle correctly', () => {
    store.orders.set([sampleOrder]);

    expect(store.isAllCurrentPageSelected()).toBe(false);
    store.toggleSelectOrder('ord-1');
    expect(store.selectedOrderIds().has('ord-1')).toBe(true);
    expect(store.isAllCurrentPageSelected()).toBe(true);

    store.clearSelection();
    expect(store.selectedOrderIds().size).toBe(0);
    expect(store.isAllCurrentPageSelected()).toBe(false);
  });
});
