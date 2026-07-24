export type AnalyticsReportKey =
  | "inventory-valuation"
  | "sales-detail"
  | "collections"
  | "accounts-receivable"
  | "low-stock"
  | "kardex"
  | "purchases-by-provider"
  | "sales-by-seller"
  | "top-products"
  | "warehouse-transfers"
  | "estimated-profit"
  | "returns-cancellations"
  | "general-summary";

export type ReportCategory =
  "PRINCIPAL" | "INVENTARIO" | "VENTAS" | "COBRANZA" | "GESTION";

export type ReportFormat =
  "text" | "number" | "currency" | "date" | "datetime" | "status";

export interface AnalyticsReportCatalogItem {
  key: AnalyticsReportKey;
  title: string;
  description: string;
  category: ReportCategory;
  adminOnly: boolean;
  requiresDateRange: boolean;
  defaultSaleStatus?: "CONFIRMED";
}

export interface AnalyticsReportFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED";
  clientId?: string;
  productId?: string;
  warehouseId?: string;
  userId?: number;
}

export interface ReportColumn {
  key: string;
  label: string;
  format?: ReportFormat;
  align?: "left" | "center" | "right";
}

export interface ReportMetric {
  label: string;
  value: string | number | boolean | null;
  format?: ReportFormat;
}

export interface ReportTableData {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Array<Record<string, string | number | boolean | null>>;
  totals?: Array<Record<string, string | number | boolean | null>>;
}

export interface ReportSection {
  title: string;
  subtitle?: string;
  metrics?: ReportMetric[];
  tables: ReportTableData[];
}

export interface AnalyticsReportDocument {
  key: AnalyticsReportKey;
  title: string;
  description: string;
  generatedAt: string;
  periodLabel?: string;
  metrics: ReportMetric[];
  sections: ReportSection[];
  emptyMessage: string;
}

export interface ReportPdfResponse {
  pdfUrl: string;
}
