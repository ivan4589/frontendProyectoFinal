export type WarehouseTransferStatus = 'COMPLETED' | 'CANCELLED';

export interface WarehouseTransferLocation {
  id: string;
  name: string;
  code: string;
}

export interface WarehouseTransferDetail {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  originWarehouseId: string;
  destinationWarehouseId: string;
  status: WarehouseTransferStatus;
  observations?: string | null;
  transferredAt: string;
  cancelledAt?: string | null;
  originWarehouse: WarehouseTransferLocation;
  destinationWarehouse: WarehouseTransferLocation;
  user: {
    id: number;
    name: string;
    email: string;
  };
  details: WarehouseTransferDetail[];
}

export interface CreateWarehouseTransferRequest {
  originWarehouseId: string;
  destinationWarehouseId: string;
  observations?: string;
  details: Array<{
    productId: string;
    quantity: number;
  }>;
}
