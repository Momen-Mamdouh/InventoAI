export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type PaymentMethod = 'cod' | string;

export type OrderFilter = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderSummaryItem {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  currency: string;
  totalAmount: number; // minor units (e.g. 59700 for 597.00)
  itemCount: number;
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

export interface MyOrdersResponse {
  items: OrderSummaryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  governorate?: string | null;
  postalCode?: string | null;
  country: string;
}

export interface OrderLineItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productTitle: string;
  productSlug: string;
  productImageUrl: string | null;
  variantOptions: Record<string, string>;
  sku: string | null;
  unitAmount: number; // minor units
  quantity: number;
  lineTotalAmount: number; // minor units
}

export interface OrderDetail {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  currency: string;
  subtotalAmount: number; // minor units
  shippingFee: number; // minor units
  totalAmount: number; // minor units
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  shippingAddress: ShippingAddress;
  customerNote?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: OrderLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CancelOrderPayload {
  reason?: string;
}

export interface OrderTimelineStep {
  title: string;
  date?: string;
  subtitle?: string;
  completed: boolean;
  current?: boolean;
  isCancelled?: boolean;
}

export interface OrderStatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: string;
}
