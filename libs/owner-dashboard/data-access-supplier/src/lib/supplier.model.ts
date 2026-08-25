export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string | null;
  leadTimeDays: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListResponse {
  items: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSupplierDto {
  name: string;
  contactEmail: string;
  phone?: string;
  leadTimeDays?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  contactEmail?: string;
  /** Send `null` to clear. */
  phone?: string | null;
  leadTimeDays?: number;
  /** Send `null` to clear. */
  notes?: string | null;
  isActive?: boolean;
}
