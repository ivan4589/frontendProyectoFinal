export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardWarehouseStock {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  productsCount: number;
}

export interface DashboardKpi {
  salesToday: number;
  salesMonth: number;
  activeClients: number;
  totalDebt: number;
  collectionToday: number;
  stockAlerts: number;
  overdueAccounts: number;
  totalStock: number;
  availableStock: number;
  stockByWarehouse: DashboardWarehouseStock[];
  generatedAt: string;
}

export interface DashboardProfit {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  estimatedProfit: number;
  profitMargin: number;
  totalUnitsSold: number;
  averageTicket: number;
  generatedAt: string;
}

export interface SalesTrend {
  labels: string[];
  data: number[];
}

export interface PaymentMethods {
  CASH: number;
  QR: number;
  BANK_TRANSFER: number;
}

export interface TopProduct {
  productId: string;
  product: string;
  quantity: number;
  total: number;
}

export interface DebtAlert {
  clientId: string;
  clientName: string;
  location: string;
  totalDebt: number;
  totalSales: number;
  oldestDebtDate: string;
  daysWithoutPayment: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
}

export interface LowStockItem {
  productId: string;
  product: string;
  category: string;
  provider: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  unit: string;
  missingQuantity: number;
}

export interface LastSale {
  id: string;
  saleNumber: string;
  date: string;
  clientName: string;
  location: string;
  total: number;
  status: string;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
  paid: number;
  balance: number;
  paymentMethods: string;
}

export interface PendingPurchase {
  purchaseId: string;
  providers: string;
  registeredBy: string;
  date: string;
  daysPending: number;
  total: number;
  detailsCount: number;
  pendingProviders: number;
  observations?: string | null;
}
