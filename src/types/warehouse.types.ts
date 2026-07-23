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
}
