// @vitest-environment jsdom
import './test-setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { AUTH_CONFIG, AuthConfig } from '@invento/shared-data-access-auth';
import { OrdersListResponse, OrderDetail } from './order.model';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  const apiBaseUrl = 'http://localhost:3000';
  const baseUrl = `${apiBaseUrl}/orders`;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_CONFIG, useValue: { apiBaseUrl } as AuthConfig },
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch orders list with query parameters', () => {
    const mockResponse: OrdersListResponse = {
      items: [
        {
          id: 'ord-1',
          orderNumber: 101,
          status: 'pending',
          paymentStatus: 'unpaid',
          paymentMethod: 'cod',
          currency: 'EGP',
          totalAmount: 89900,
          itemCount: 2,
          contactName: 'John Doe',
          contactEmail: 'john@example.com',
          createdAt: '2026-08-15T09:30:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    service
      .getOrders({
        page: 1,
        limit: 10,
        search: '101',
        status: 'pending',
        sort: 'createdAt',
        order: 'DESC',
      })
      .subscribe((res) => {
        expect(res.items.length).toBe(1);
        expect(res.items[0].orderNumber).toBe(101);
      });

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('101');
    expect(req.request.params.get('status')).toBe('pending');
    expect(req.request.params.get('sort')).toBe('createdAt');
    expect(req.request.params.get('order')).toBe('DESC');

    req.flush(mockResponse);
  });

  it('should fetch single order detail by id', () => {
    const mockDetail: OrderDetail = {
      id: 'ord-1',
      orderNumber: 101,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      paymentMethod: 'cod',
      currency: 'EGP',
      subtotalAmount: 80000,
      shippingFee: 9900,
      totalAmount: 89900,
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      contactPhone: '+20123456789',
      shippingAddress: {
        line1: '123 Main St',
        city: 'Cairo',
        country: 'EG',
      },
      customerNote: 'Please call before delivery',
      cancelledAt: null,
      cancelReason: null,
      items: [],
      internalNote: 'VIP client',
      userId: 'user-1',
      createdAt: '2026-08-15T09:30:00Z',
      updatedAt: '2026-08-15T09:35:00Z',
    };

    service.getOrderById('ord-1').subscribe((detail) => {
      expect(detail.id).toBe('ord-1');
      expect(detail.internalNote).toBe('VIP client');
    });

    const req = httpMock.expectOne(`${baseUrl}/ord-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });

  it('should update order status via PATCH /orders/:id/status', () => {
    service.updateOrderStatus('ord-1', { status: 'shipped' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/ord-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'shipped' });
    req.flush({ id: 'ord-1', status: 'shipped' });
  });

  it('should update internal note via PATCH /orders/:id/note', () => {
    service.updateOrderNote('ord-1', 'Updated note content').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/ord-1/note`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ internalNote: 'Updated note content' });
    req.flush({ id: 'ord-1', internalNote: 'Updated note content' });
  });
});
