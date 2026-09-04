export interface CartItem {
  variantId: string;
  productId?: string | null;
  productSlug?: string;
  productTitle: string;
  productImageUrl?: string | null;
  variantOptions?: Record<string, string>;
  sku?: string | null;
  unitAmount: number; // Minor units (e.g. 89900 = 899.00 EGP)
  quantity: number;
  lineTotalAmount?: number;
}

export interface ShippingAddressInput {
  line1: string;
  line2?: string;
  city: string;
  governorate?: string;
  postalCode?: string;
  country: string; // ISO 3166-1 alpha-2, e.g. "EG"
}

export interface PrefillCustomerInfo {
  firstName?: string;
  lastName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  shippingAddress?: {
    line1?: string;
    line2?: string | null;
    city?: string;
    governorate?: string | null;
    postalCode?: string | null;
    country?: string;
  };
  customerNote?: string;
}

export interface CreateOrderPayload {
  items: {
    variantId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddressInput;
  contactPhone: string;
  customerNote?: string;
  paymentMethod?: 'cod';
}

export interface PlacedOrderResponse {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  currency: string;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    governorate?: string | null;
    postalCode?: string | null;
    country: string;
  };
  customerNote?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: {
    id: string;
    productId?: string | null;
    variantId?: string | null;
    productTitle: string;
    productSlug?: string;
    productImageUrl?: string | null;
    variantOptions?: Record<string, string>;
    sku?: string | null;
    unitAmount: number;
    quantity: number;
    lineTotalAmount: number;
  }[];

  createdAt: string;
  updatedAt: string;
}
