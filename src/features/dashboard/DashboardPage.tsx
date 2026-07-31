import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWallet,
  ArrowForward,
  Assessment,
  AttachMoney,
  Inventory2,
  People,
  PointOfSale,
  Refresh,
  ShoppingCart,
  TrendingUp,
  WarningAmber,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getDashboardKpi,
  getDashboardProfit,
  getDebtAlerts,
  getLastSales,
  getLowStock,
  getPaymentMethods,
  getPendingPurchases,
  getSalesTrend,
  getTopProducts,
} from '../../api/dashboard.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../auth/AuthContext';

const chartColors = ['#0b6b4a', '#1976d2', '#ed6c02'];

const paymentLabels: Record<string, string> = {
  CASH: 'Efectivo',
  QR: 'QR',
  BANK_TRANSFER: 'Transferencia',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagado',
};

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatQuantity(value: number | null | undefined) {
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 142,
      }}
    >
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h5" sx={{ mt: 1, wordBreak: 'break-word' }}>
            {value}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {subtitle}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>{icon}</Avatar>
      </Stack>
    </Paper>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          mb: 2,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle && (
            <Typography color="text.secondary" variant="body2">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [periodDays, setPeriodDays] = useState(30);
  const isAdmin = user?.role === 'ADMIN';

  const filters = useMemo(() => {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - (periodDays - 1));

    return {
      dateFrom: toInputDate(dateFrom),
      dateTo: toInputDate(dateTo),
    };
  }, [periodDays]);

  const kpiQuery = useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: getDashboardKpi,
  });
  const profitQuery = useQuery({
    queryKey: ['dashboard', 'profit', filters],
    queryFn: () => getDashboardProfit(filters),
    enabled: isAdmin,
  });
  const trendQuery = useQuery({
    queryKey: ['dashboard', 'trend', filters],
    queryFn: () => getSalesTrend(filters),
  });
  const paymentMethodsQuery = useQuery({
    queryKey: ['dashboard', 'payments', filters],
    queryFn: () => getPaymentMethods(filters),
    enabled: isAdmin,
  });
  const topProductsQuery = useQuery({
    queryKey: ['dashboard', 'top-products', filters],
    queryFn: () => getTopProducts(filters),
  });
  const debtAlertsQuery = useQuery({
    queryKey: ['dashboard', 'debt-alerts', filters],
    queryFn: () => getDebtAlerts(filters),
    enabled: isAdmin,
  });
  const lowStockQuery = useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: getLowStock,
  });
  const lastSalesQuery = useQuery({
    queryKey: ['dashboard', 'last-sales', filters],
    queryFn: () => getLastSales(filters),
  });
  const pendingPurchasesQuery = useQuery({
    queryKey: ['dashboard', 'pending-purchases'],
    queryFn: getPendingPurchases,
    enabled: isAdmin,
  });

  const trendData = useMemo(
    () =>
      (trendQuery.data?.labels ?? []).map((date, index) => ({
        date,
        total: trendQuery.data?.data[index] ?? 0,
      })),
    [trendQuery.data],
  );

  const paymentData = useMemo(
    () =>
      Object.entries(paymentMethodsQuery.data ?? {}).map(([method, total]) => ({
        method: paymentLabels[method] ?? method,
        total,
      })),
    [paymentMethodsQuery.data],
  );

  const topProductsData = useMemo(
    () =>
      (topProductsQuery.data ?? []).map((item) => ({
        name:
          item.product.length > 20
            ? `${item.product.slice(0, 20)}…`
            : item.product,
        cantidad: item.quantity,
      })),
    [topProductsQuery.data],
  );

  const refreshDashboard = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  if (kpiQuery.isError) {
    return (
      <ErrorMessage message="No se pudo cargar el dashboard. Verifica que el backend esté actualizado y vuelve a intentar." />
    );
  }

  const kpi = kpiQuery.data;
  const central = kpi?.stockByWarehouse.find((item) => item.isDefault);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Box>
          <Typography variant="h4">Resumen del negocio</Typography>
          <Typography color="text.secondary">
            Hola, {user?.name || 'usuario'}. Vista comercial para{' '}
            {isAdmin ? 'administración' : 'ventas'}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={periodDays}
              onChange={(event) => setPeriodDays(Number(event.target.value))}
            >
              <MenuItem value={7}>Últimos 7 días</MenuItem>
              <MenuItem value={30}>Últimos 30 días</MenuItem>
              <MenuItem value={90}>Últimos 90 días</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Actualizar datos">
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshDashboard}
            >
              Actualizar
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {!isAdmin && (
        <Alert severity="info">
          Esta vista muestra información comercial global. Los saldos, cobros,
          deudas y utilidades están restringidos al administrador.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {kpiQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={142} />
          ))
        ) : (
          <>
            <KpiCard
              title="Ventas de hoy"
              value={formatCurrency(kpi?.salesToday)}
              subtitle={`${formatCurrency(kpi?.salesMonth)} en el mes`}
              icon={<PointOfSale />}
              color="#0b6b4a"
            />
            <KpiCard
              title="Stock disponible Central"
              value={formatQuantity(central?.availableStock)}
              subtitle={`${kpi?.stockAlerts ?? 0} productos con alerta`}
              icon={<Inventory2 />}
              color="#7b1fa2"
            />
            <KpiCard
              title="Clientes activos"
              value={String(kpi?.activeClients ?? 0)}
              subtitle="Con ventas en los últimos 30 días"
              icon={<People />}
              color="#00838f"
            />
            {isAdmin && (
              <KpiCard
                title="Cobrado hoy"
                value={formatCurrency(kpi?.collectionToday)}
                subtitle="Pagos registrados durante el día"
                icon={<AccountBalanceWallet />}
                color="#1976d2"
              />
            )}
            {isAdmin && (
              <KpiCard
                title="Cuentas por cobrar"
                value={formatCurrency(kpi?.totalDebt)}
                subtitle={`${kpi?.overdueAccounts ?? 0} cuentas vencidas`}
                icon={<AttachMoney />}
                color="#ed6c02"
              />
            )}
            {isAdmin && (
              <KpiCard
                title="Ganancia estimada"
                value={formatCurrency(profitQuery.data?.estimatedProfit)}
                subtitle={`${profitQuery.data?.profitMargin ?? 0}% de margen`}
                icon={<TrendingUp />}
                color="#2e7d32"
              />
            )}
            {isAdmin && (
              <KpiCard
                title="Compras pendientes"
                value={String(pendingPurchasesQuery.data?.length ?? 0)}
                subtitle="Órdenes por recibir"
                icon={<ShoppingCart />}
                color="#455a64"
              />
            )}
          </>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: isAdmin ? 'minmax(0, 2fr) minmax(320px, 1fr)' : '1fr',
          },
          gap: 2,
        }}
      >
        <Section
          title="Tendencia de ventas"
          subtitle={`Ventas confirmadas de los últimos ${periodDays} días`}
        >
          <Box sx={{ width: '100%', height: 310 }}>
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Intl.DateTimeFormat('es-BO', {
                      day: '2-digit',
                      month: 'short',
                    }).format(new Date(`${value}T12:00:00`))
                  }
                  minTickGap={24}
                />
                <YAxis tickFormatter={(value) => `Bs ${value}`} width={78} />
                <ChartTooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Ventas',
                  ]}
                  labelFormatter={(value) =>
                    formatDate(`${value}T12:00:00`)
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0b6b4a"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Section>

        {isAdmin && (
          <Section
            title="Cobros por método"
            subtitle={`Dinero recibido en los últimos ${periodDays} días`}
          >
            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="total"
                    nameKey="method"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {paymentData.map((item, index) => (
                      <Cell
                        key={item.method}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack spacing={1}>
              {paymentData.map((item) => (
                <Stack
                  key={item.method}
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">{item.method}</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatCurrency(item.total)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Section>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Section
          title="Productos más vendidos"
          subtitle={`Por unidades en los últimos ${periodDays} días`}
          action={
            <Button
              component={RouterLink}
              to="/reports"
              size="small"
              endIcon={<Assessment />}
            >
              Reporte
            </Button>
          }
        >
          {topProductsData.length === 0 ? (
            <Alert severity="info">No hay ventas en este periodo.</Alert>
          ) : (
            <Box sx={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={135}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip />
                  <Bar
                    dataKey="cantidad"
                    name="Unidades"
                    fill="#1976d2"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Section>

        <Section
          title="Alertas de stock Central"
          subtitle="Productos disponibles en el mínimo o por debajo"
          action={
            <Chip
              icon={<WarningAmber />}
              label={`${lowStockQuery.data?.length ?? 0} alertas`}
              color={(lowStockQuery.data?.length ?? 0) > 0 ? 'warning' : 'success'}
            />
          }
        >
          <TableContainer sx={{ maxHeight: 340 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="right">Disponible</TableCell>
                  <TableCell align="right">Mínimo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(lowStockQuery.data ?? []).slice(0, 6).map((item) => (
                  <TableRow key={item.productId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {item.product}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.category}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.provider}</TableCell>
                    <TableCell align="right">
                      {formatQuantity(item.availableStock)}
                    </TableCell>
                    <TableCell align="right">
                      {formatQuantity(item.minStock)}
                    </TableCell>
                  </TableRow>
                ))}
                {(lowStockQuery.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      El stock se encuentra dentro de los niveles definidos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      </Box>

      {isAdmin && (
        <Section
          title="Alertas de cobranza"
          subtitle="Clientes con saldo pendiente ordenados por mayor deuda"
          action={
            <Button
              component={RouterLink}
              to="/collections"
              size="small"
              endIcon={<ArrowForward />}
            >
              Ir a cobranza
            </Button>
          }
        >
          <TableContainer sx={{ maxHeight: 340 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Antigüedad</TableCell>
                  <TableCell>Riesgo</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(debtAlertsQuery.data ?? []).slice(0, 6).map((item) => (
                  <TableRow key={item.clientId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {item.clientName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.location}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.daysWithoutPayment} días</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.riskLevel}
                        color={
                          item.riskLevel === 'ALTO'
                            ? 'error'
                            : item.riskLevel === 'MEDIO'
                              ? 'warning'
                              : 'success'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.totalDebt)}
                    </TableCell>
                  </TableRow>
                ))}
                {(debtAlertsQuery.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay cuentas pendientes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      )}

      <Section
        title="Últimas ventas confirmadas"
        subtitle="Actividad comercial reciente"
        action={
          <Button
            component={RouterLink}
            to="/sales"
            size="small"
            endIcon={<ArrowForward />}
          >
            Ver ventas
          </Button>
        }
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N.º venta</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                {isAdmin && <TableCell>Estado de pago</TableCell>}
                <TableCell align="right">Total</TableCell>
                {isAdmin && <TableCell align="right">Saldo</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(lastSalesQuery.data ?? []).slice(0, 6).map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>{sale.saleNumber}</TableCell>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {sale.clientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sale.location}
                    </Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          paymentStatusLabels[sale.paymentStatus] ??
                          sale.paymentStatus
                        }
                        color={
                          sale.paymentStatus === 'PAID'
                            ? 'success'
                            : sale.paymentStatus === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell align="right">
                    {formatCurrency(sale.total)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      {formatCurrency(sale.balance)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {isAdmin && (pendingPurchasesQuery.data?.length ?? 0) > 0 && (
        <Section
          title="Compras pendientes de recepción"
          subtitle="Órdenes que requieren seguimiento"
        >
          <Stack spacing={1.5}>
            {(pendingPurchasesQuery.data ?? []).slice(0, 5).map((purchase) => (
              <Paper key={purchase.purchaseId} variant="outlined" sx={{ p: 1.5 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography fontWeight={700}>
                      {purchase.providers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {purchase.detailsCount} productos · registrada por{' '}
                      {purchase.registeredBy}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography fontWeight={700}>
                      {formatCurrency(purchase.total)}
                    </Typography>
                    <Typography variant="caption" color="warning.main">
                      {purchase.daysPending} días pendiente
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Section>
      )}

      {central && (
        <Section title="Disponibilidad del Almacén Central">
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography>{central.productsCount} productos con stock</Typography>
              <Typography fontWeight={700}>
                {formatQuantity(central.availableStock)} disponibles
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={
                central.totalStock > 0
                  ? Math.max(
                      0,
                      (central.availableStock / central.totalStock) * 100,
                    )
                  : 0
              }
              color="success"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Stack>
        </Section>
      )}
    </Stack>
  );
}
