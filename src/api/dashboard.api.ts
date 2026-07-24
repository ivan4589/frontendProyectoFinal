import { api } from './axios';
import type {
  DashboardFilters,
  DashboardKpi,
  DashboardProfit,
  DebtAlert,
  LastSale,
  LowStockItem,
  PaymentMethods,
  PendingPurchase,
  SalesTrend,
  TopProduct,
} from '../types/dashboard.types';

export async function getDashboardKpi() {
  const response = await api.get<DashboardKpi>('/dashboard/kpi');
  return response.data;
}

export async function getDashboardProfit(filters: DashboardFilters) {
  const response = await api.get<DashboardProfit>(
    '/dashboard/profit-summary',
    { params: filters },
  );
  return response.data;
}

export async function getSalesTrend(filters: DashboardFilters) {
  const response = await api.get<SalesTrend>('/dashboard/sales-trend', {
    params: filters,
  });
  return response.data;
}

export async function getPaymentMethods(filters: DashboardFilters) {
  const response = await api.get<PaymentMethods>(
    '/dashboard/payment-methods',
    { params: filters },
  );
  return response.data;
}

export async function getTopProducts(filters: DashboardFilters) {
  const response = await api.get<TopProduct[]>('/dashboard/top-products', {
    params: filters,
  });
  return response.data;
}

export async function getDebtAlerts(filters: DashboardFilters) {
  const response = await api.get<DebtAlert[]>('/dashboard/debt-alerts', {
    params: filters,
  });
  return response.data;
}

export async function getLowStock() {
  const response = await api.get<LowStockItem[]>('/dashboard/low-stock');
  return response.data;
}

export async function getLastSales(filters: DashboardFilters) {
  const response = await api.get<LastSale[]>('/dashboard/last-sales', {
    params: filters,
  });
  return response.data;
}

export async function getPendingPurchases() {
  const response = await api.get<PendingPurchase[]>(
    '/dashboard/pending-purchases',
  );
  return response.data;
}
