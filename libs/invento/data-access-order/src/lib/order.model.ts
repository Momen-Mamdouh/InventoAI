export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type OrderPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderPaymentMethod = 'cod' | string;

export interface OrderShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  governorate?: string | null;
  postalCode?: string | null;
  country: string;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string | null;
  variantId: string | null;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
  variantOptions: Record<string, string>;
  sku: string | null;
  unitAmount: number; // Minor units (e.g. 89900 = 899.00 EGP)
  quantity: number;
  lineTotalAmount: number; // Minor units
}

export interface OrderListItem {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  currency: string;
  totalAmount: number; // Minor units
  itemCount: number; // Distinct lines
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  currency: string;
  subtotalAmount: number; // Minor units
  shippingFee: number; // Minor units
  totalAmount: number; // Minor units
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  shippingAddress: OrderShippingAddress;
  customerNote: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItemSnapshot[];
  internalNote: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: OrderPaymentStatus | 'all';
  fromDate?: string;
  toDate?: string;
  sort?: 'createdAt' | 'totalAmount';
  order?: 'ASC' | 'DESC';
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  reason?: string;
}

export interface UpdateOrderNoteDto {
  internalNote: string;
}

export interface OrderStatsSummary {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}
