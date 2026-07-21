export type PurchaseStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CANCELLED';

export type PurchaseProviderStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseDetail {
  id: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceNormal?: number | null;
  priceCamino?: number | null;
  priceEspecial?: number | null;
  priceMayorista?: number | null;
  minQuantityWholesale?: number | null;
}

export interface PurchaseProviderGroup {
  id: string;
  providerId: string;
  providerName: string;
  status: PurchaseProviderStatus;
  total: number;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  details: PurchaseDetail[];
}

export interface Purchase {
  id: string;
  userId: number;
  userName: string;
  date: string;
  status: PurchaseStatus;
  total: number;
  observations?: string | null;
  pdfUrl?: string | null;
  providerGroups: PurchaseProviderGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseDetailRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  priceNormal: number;
  priceCamino: number;
  priceEspecial: number;
  priceMayorista?: number | null;
  minQuantityWholesale?: number | null;
}

export interface CreatePurchaseRequest {
  observations?: string;
  details: PurchaseDetailRequest[];
}

export interface UpdatePurchaseRequest {
  observations?: string;
  details?: PurchaseDetailRequest[];
}