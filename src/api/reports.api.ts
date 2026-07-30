import { api } from "./axios";
import type {
  AnalyticsReportCatalogItem,
  AnalyticsReportDocument,
  AnalyticsReportFilters,
  AnalyticsReportKey,
  ReportPdfResponse,
} from "../types/report.types";

export async function getReportCatalog() {
  const response =
    await api.get<AnalyticsReportCatalogItem[]>("/reports/catalog");

  return response.data;
}

export async function getAnalyticsReport(
  key: AnalyticsReportKey,
  filters: AnalyticsReportFilters,
) {
  const response = await api.get<AnalyticsReportDocument>(
    `/reports/data/${key}`,
    { params: filters },
  );

  return response.data;
}

export async function generateAnalyticsReportPdf(
  key: AnalyticsReportKey,
  filters: AnalyticsReportFilters,
) {
  const response = await api.post<ReportPdfResponse>(
    `/reports/pdf/${key}`,
    undefined,
    { params: filters },
  );

  return response.data;
}

export async function generateSalesMatrixPdf(
  filters: AnalyticsReportFilters,
) {
  const response = await api.post<ReportPdfResponse>(
    "/reports/pdf/sales-detail/matrix",
    undefined,
    { params: filters },
  );

  return response.data;
}
