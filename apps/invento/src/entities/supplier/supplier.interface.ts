// The canonical Supplier type now lives with the API layer, since it must match
// the backend contract exactly. Re-exported here so existing imports keep working.
export type { Supplier } from '../../features/suppliers/supplier.model';
