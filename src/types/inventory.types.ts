export interface CentralInventoryProduct {
  productId: string;
  code: string;
  name: string;
  unit: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
}

export interface CentralInventoryCategory {
  categoryId: string;
  categoryName: string;
  products: CentralInventoryProduct[];
  totalStock: number;
  totalReservedStock: number;
  totalAvailableStock: number;
}

export interface CentralInventoryProvider {
  providerId: string;
  providerName: string;
  categories: CentralInventoryCategory[];
  totalProducts: number;
  totalStock: number;
  totalReservedStock: number;
  totalAvailableStock: number;
}

export interface CentralInventoryResponse {
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  providers: CentralInventoryProvider[];
  generatedAt: string;
  totalProducts: number;
  totalStock: number;
  totalReservedStock: number;
  totalAvailableStock: number;
}

export interface InventoryPdfResponse {
  success: boolean;
  pdfUrl: string;
  historyId: string;
  message: string;
}

export interface AdjustInventoryRequest {
  warehouseId: string;
  productId: string;
  quantityChange: number;
  reason: string;
}

export interface AdjustInventoryResponse {
  movementId: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  previousStock: number;
  quantityChange: number;
  newStock: number;
  reservedStock: number;
}
