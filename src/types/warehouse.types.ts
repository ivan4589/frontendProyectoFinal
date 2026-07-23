export interface Warehouse {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  totalStock?: number;
  reservedStock?: number;
  availableStock?: number;
  productsCount?: number;
  stocks?: WarehouseStock[];
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  reserveQuantity: number;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}
