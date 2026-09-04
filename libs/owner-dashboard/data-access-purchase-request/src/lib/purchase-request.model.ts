export type PurchaseRequestStatus = 'draft' | 'sent' | 'replied' | 'confirmed' | 'cancelled';
export type OfferStatus = 'awaiting' | 'received' | 'won' | 'declined';
export type ExtractionStatus = 'parsed' | 'failed' | 'manual';

export interface PurchaseRequestSummary {
  id: string;
  productId: string | null;
  variantId: string | null;
  productTitle: string;
  variantLabel: string | null;
  quantity: number;
  neededWithinDays: number | null;
  subject: string;
  body: string;
  note: string | null;
  status: PurchaseRequestStatus;
  draftStatus: 'ai' | 'fallback';
  offerCount: number;
  receivedCount: number;
  sentAt: string | null;
  confirmedAt: string | null;
  confirmedOfferId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOffer {
  id: string;
  supplierId: string | null;
  supplierName: string;
  supplierEmail: string;
  status: OfferStatus;
  unitAmount: number | null;
  quantity: number | null;
  deliveryDays: number | null;
  notes: string | null;
  rawReply: string | null;
  extractionStatus: ExtractionStatus | null;
  sentAt: string | null;
  repliedAt: string | null;
  decidedAt: string | null;
  totalAmount: number | null;
  rank: number | null;
  isRecommended: boolean;
  isCheapest: boolean;
  isFastest: boolean;
  isLate: boolean;
  isWatched: boolean;
  createdAt: string;
}

export interface PurchaseRequestDetail extends PurchaseRequestSummary {
  offers: SupplierOffer[];
}

export interface PurchaseRequestListResponse {
  items: PurchaseRequestSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePurchaseRequestDto {
  variantId: string;
  quantity: number;
  supplierIds: string[];
  neededWithinDays?: number;
  note?: string;
}

export interface UpdatePurchaseRequestDto {
  subject?: string;
  body?: string;
  quantity?: number;
  neededWithinDays?: number | null;
  note?: string | null;
  supplierIds?: string[];
}

export interface PasteSupplierReplyDto {
  body: string;
}

export interface CorrectOfferDto {
  unitAmount?: number | null;
  quantity?: number | null;
  deliveryDays?: number | null;
  notes?: string | null;
}

export interface MailboxStatus {
  isSupported: boolean;
  isConnected: boolean;
  provider: 'gmail' | null;
  accountEmail: string | null;
  status: 'connected' | 'expired' | 'revoked' | null;
  scopes: string[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
}

export interface MailboxConnectResponse {
  consentUrl: string;
  state: string;
}

export interface MailboxSyncResponse {
  message: string;
}
