import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  generateAnalyticsReportPdf,
  getAnalyticsReport,
  getReportCatalog,
} from "../../api/reports.api";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { Loading } from "../../components/common/Loading";
import type {
  AnalyticsReportCatalogItem,
  AnalyticsReportFilters,
  AnalyticsReportKey,
  ReportFormat,
  ReportMetric,
} from "../../types/report.types";

const categoryLabels = {
  PRINCIPAL: "Principales",
  INVENTARIO: "Inventario",
  VENTAS: "Ventas",
  COBRANZA: "Cobranza",
  GESTION: "Gestión",
} as const;

function localDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultFilters(): AnalyticsReportFilters {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    dateFrom: localDateInput(firstDay),
    dateTo: localDateInput(today),
    status: "CONFIRMED",
  };
}

function getErrorMessage(error: unknown): string {
  const requestError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };
  const message = requestError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return typeof message === "string"
    ? message
    : requestError.message || "No se pudo consultar el reporte.";
}

function formatValue(value: unknown, format: ReportFormat = "text"): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (format === "currency") {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(Number(value));
  }

  if (format === "number") {
    return new Intl.NumberFormat("es-BO", {
      maximumFractionDigits: 3,
    }).format(Number(value));
  }

  if (format === "date" || format === "datetime") {
    return new Intl.DateTimeFormat("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(format === "datetime"
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }).format(new Date(String(value)));
  }

  return String(value);
}

function openPdf(pdfUrl: string) {
  const absoluteUrl =
    pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")
      ? pdfUrl
      : `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${pdfUrl}`;

  window.open(absoluteUrl, "_blank", "noopener,noreferrer");
}

function MetricCard({ metric }: { metric: ReportMetric }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" variant="body2">
          {metric.label}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: "#07553d",
            fontWeight: 800,
            mt: 0.5,
          }}
        >
          {formatValue(metric.value, metric.format)}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const [selectedKey, setSelectedKey] = useState<AnalyticsReportKey | null>(
    null,
  );
  const [draftFilters, setDraftFilters] =
    useState<AnalyticsReportFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AnalyticsReportFilters>(defaultFilters);

  const catalogQuery = useQuery({
    queryKey: ["reports", "catalog"],
    queryFn: getReportCatalog,
  });

  const activeKey = selectedKey || catalogQuery.data?.[0]?.key || null;

  const selectedReport = useMemo(
    () => catalogQuery.data?.find((item) => item.key === activeKey) || null,
    [activeKey, catalogQuery.data],
  );

  const requestFilters = useMemo(() => {
    if (!selectedReport) {
      return {};
    }

    const filters: AnalyticsReportFilters = {};

    if (selectedReport.requiresDateRange) {
      filters.dateFrom = appliedFilters.dateFrom;
      filters.dateTo = appliedFilters.dateTo;
    }

    if (selectedReport.key === "sales-detail") {
      filters.status = appliedFilters.status || "CONFIRMED";
    }

    return filters;
  }, [appliedFilters, selectedReport]);

  const reportQuery = useQuery({
    queryKey: ["reports", activeKey, requestFilters],
    queryFn: () => getAnalyticsReport(activeKey!, requestFilters),
    enabled: Boolean(activeKey),
  });

  const pdfMutation = useMutation({
    mutationFn: () => generateAnalyticsReportPdf(activeKey!, requestFilters),
    onSuccess: (result) => openPdf(result.pdfUrl),
  });

  if (catalogQuery.isLoading) {
    return <Loading message="Preparando los reportes..." />;
  }

  if (catalogQuery.isError || !catalogQuery.data) {
    return <ErrorMessage message={getErrorMessage(catalogQuery.error)} />;
  }

  const categories = Object.keys(categoryLabels) as Array<
    keyof typeof categoryLabels
  >;

  const selectReport = (report: AnalyticsReportCatalogItem) => {
    setSelectedKey(report.key);
    const nextFilters = defaultFilters();
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <AssessmentIcon color="primary" sx={{ fontSize: 38 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Reportes
            </Typography>
            <Typography color="text.secondary">
              Consulta toda la información en pantalla antes de generar el PDF.
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!activeKey || !reportQuery.data || pdfMutation.isPending}
          onClick={() => pdfMutation.mutate()}
        >
          {pdfMutation.isPending ? "Generando PDF..." : "Generar PDF"}
        </Button>
      </Stack>

      {pdfMutation.isError && (
        <Alert severity="error">{getErrorMessage(pdfMutation.error)}</Alert>
      )}

      <Stack spacing={2}>
        {categories.map((category) => {
          const reports = catalogQuery.data.filter(
            (report) => report.category === category,
          );

          if (!reports.length) return null;

          return (
            <Box key={category}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 800 }}
              >
                {categoryLabels[category]}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {reports.map((report) => (
                  <Card
                    key={report.key}
                    variant={
                      activeKey === report.key ? "elevation" : "outlined"
                    }
                    sx={{
                      border:
                        activeKey === report.key
                          ? "2px solid #07553d"
                          : undefined,
                    }}
                  >
                    <CardActionArea
                      onClick={() => selectReport(report)}
                      sx={{ height: "100%" }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              flexGrow: 1,
                              fontWeight: 800,
                            }}
                          >
                            {report.title}
                          </Typography>
                          {report.adminOnly && (
                            <LockIcon fontSize="small" color="action" />
                          )}
                        </Stack>
                        <Typography
                          color="text.secondary"
                          variant="body2"
                          sx={{ mt: 1 }}
                        >
                          {report.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {selectedReport && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{ alignItems: "stretch" }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                minWidth: 150,
              }}
            >
              <FilterAltIcon color="action" />
              <Typography sx={{ fontWeight: 800 }}>Filtros</Typography>
            </Stack>

            {selectedReport.requiresDateRange && (
              <>
                <TextField
                  label="Fecha inicial"
                  type="date"
                  value={draftFilters.dateFrom || ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      dateFrom: event.target.value,
                    }))
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  fullWidth
                />
                <TextField
                  label="Fecha final"
                  type="date"
                  value={draftFilters.dateTo || ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      dateTo: event.target.value,
                    }))
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  fullWidth
                />
              </>
            )}

            {selectedReport.key === "sales-detail" && (
              <TextField
                select
                label="Estado de venta"
                value={draftFilters.status || "CONFIRMED"}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: event.target
                      .value as AnalyticsReportFilters["status"],
                  }))
                }
                fullWidth
              >
                <MenuItem value="CONFIRMED">Confirmadas</MenuItem>
                <MenuItem value="PENDING">Pendientes</MenuItem>
                <MenuItem value="CANCELLED">Anuladas</MenuItem>
              </TextField>
            )}

            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() =>
                setAppliedFilters({
                  ...draftFilters,
                })
              }
              sx={{ minWidth: 150 }}
            >
              Consultar
            </Button>
          </Stack>
        </Paper>
      )}

      {reportQuery.isLoading && (
        <Loading message="Consultando información..." />
      )}

      {reportQuery.isError && (
        <ErrorMessage message={getErrorMessage(reportQuery.error)} />
      )}

      {reportQuery.data && (
        <Stack spacing={3}>
          <Paper
            sx={{
              bgcolor: "#07553d",
              color: "common.white",
              p: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {reportQuery.data.title}
            </Typography>
            <Typography sx={{ opacity: 0.88, mt: 0.5 }}>
              {reportQuery.data.description}
            </Typography>
            {reportQuery.data.periodLabel && (
              <Chip
                label={`Periodo: ${reportQuery.data.periodLabel}`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "common.white",
                  mt: 1.5,
                }}
              />
            )}
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {reportQuery.data.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </Box>

          {reportQuery.data.sections.map((section, sectionIndex) => (
            <Accordion
              key={`${section.title}-${sectionIndex}`}
              defaultExpanded
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: "background.default",
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {section.title}
                  </Typography>
                  {section.subtitle && (
                    <Typography color="text.secondary" variant="body2">
                      {section.subtitle}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Stack spacing={2.5}>
                  {section.metrics?.length ? (
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1}
                    >
                      {section.metrics.map((metric) => (
                        <Chip
                          key={metric.label}
                          label={`${metric.label}: ${formatValue(
                            metric.value,
                            metric.format,
                          )}`}
                        />
                      ))}
                    </Stack>
                  ) : null}

                  {section.tables.map((table, tableIndex) => (
                    <Paper
                      key={`${table.title}-${tableIndex}`}
                      variant="outlined"
                    >
                      <Box sx={{ p: 2 }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                          }}
                        >
                          {table.title}
                        </Typography>
                        {table.subtitle && (
                          <Typography color="text.secondary" variant="body2">
                            {table.subtitle}
                          </Typography>
                        )}
                      </Box>
                      <Divider />

                      {table.rows.length === 0 ? (
                        <Box
                          sx={{
                            color: "text.secondary",
                            p: 4,
                            textAlign: "center",
                          }}
                        >
                          {reportQuery.data.emptyMessage}
                        </Box>
                      ) : (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {table.columns.map((column) => (
                                  <TableCell
                                    key={column.key}
                                    align={column.align || "left"}
                                    sx={{
                                      bgcolor: "#e7f0eb",
                                      fontWeight: 800,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {column.label}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {table.rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex} hover>
                                  {table.columns.map((column) => (
                                    <TableCell
                                      key={column.key}
                                      align={column.align || "left"}
                                    >
                                      {formatValue(
                                        row[column.key],
                                        column.format,
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                              {table.totals?.map((row, rowIndex) => (
                                <TableRow
                                  key={`total-${rowIndex}`}
                                  sx={{
                                    bgcolor: "#f1f5f2",
                                  }}
                                >
                                  {table.columns.map((column) => (
                                    <TableCell
                                      key={column.key}
                                      align={column.align || "left"}
                                      sx={{
                                        fontWeight: 800,
                                      }}
                                    >
                                      {formatValue(
                                        row[column.key],
                                        column.format,
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
