import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  assignCollection,
  createCollectionPayment,
  generateAssignmentsPdf,
  generateGeneralDebtPdf,
  generateUserAssignmentsPdf,
  getCollectionAssignableUsers,
  getCollectionDebts,
  unassignCollection,
} from '../../api/collections.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { downloadProtectedDocument } from '../../api/documents.api';
import { Loading } from '../../components/common/Loading';
import type {
  CollectionDebtClient,
  CollectionDebtSale,
} from '../../types/collection.types';
import type { PaymentMethod } from '../../types/sale.types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { requestEconomicReason } from '../../utils/economicOperation';
import { PaymentReversalsPanel } from './PaymentReversalsPanel';
import { useAuth } from '../auth/AuthContext';
import { hasPermission, PERMISSIONS } from '../auth/permissions';

type DebtFilter =
  | 'ALL'
  | 'OVERDUE'
  | 'UNASSIGNED';

interface PaymentSelection {
  client: CollectionDebtClient;
  sale: CollectionDebtSale;
}

const roleLabels = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  COBRADOR: 'Cobrador',
} as const;

const paymentMethodLabels: Record<
  PaymentMethod,
  string
> = {
  CASH: 'Efectivo',
  QR: 'QR',
  BANK_TRANSFER: 'Transferencia bancaria',
};

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
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return (
    requestError.message ||
    'No se pudo completar la operación.'
  );
}

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canRegisterPayment = hasPermission(
    user?.role,
    PERMISSIONS.PAYMENTS_CREATE_ASSIGNED,
  );
  const canDownloadOwnCollectionReport =
    user?.role === 'COBRADOR' &&
    hasPermission(user?.role, PERMISSIONS.REPORTS_COLLECTIONS_ASSIGNED);

  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<DebtFilter>('ALL');
  const [expandedClients, setExpandedClients] =
    useState<Set<string>>(new Set());
  const [actionError, setActionError] =
    useState<string | null>(null);
  const [paymentSelection, setPaymentSelection] =
    useState<PaymentSelection | null>(null);
  const [paymentAmount, setPaymentAmount] =
    useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('CASH');
  const [paymentReference, setPaymentReference] =
    useState('');
  const [paymentObservations, setPaymentObservations] =
    useState('');

  const debtsQuery = useQuery({
    queryKey: ['collections', 'debts'],
    queryFn: getCollectionDebts,
  });

  const usersQuery = useQuery({
    queryKey: ['collections', 'assignable-users'],
    queryFn: getCollectionAssignableUsers,
    enabled: isAdmin,
  });

  const refreshDebts = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['collections', 'debts'],
    });
  };

  const assignmentMutation = useMutation({
    mutationFn: async ({
      saleId,
      assignedToId,
      reason,
    }: {
      saleId: string;
      assignedToId: number | null;
      reason?: string;
    }) => {
      if (assignedToId === null) {
        if (!reason) throw new Error('Debes indicar el motivo de la desasignación.');
        return unassignCollection(saleId, reason);
      }

      return assignCollection(
        saleId,
        assignedToId,
      );
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshDebts();
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: createCollectionPayment,
    onSuccess: async () => {
      setActionError(null);
      setPaymentSelection(null);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentObservations('');
      await refreshDebts();
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const pdfMutation = useMutation({
    mutationFn: async ({
      kind,
      userId,
    }: {
      kind: 'GENERAL' | 'ASSIGNMENTS' | 'USER';
      userId?: number;
    }) => {
      const result =
        kind === 'GENERAL'
          ? await generateGeneralDebtPdf()
          : kind === 'ASSIGNMENTS'
            ? await generateAssignmentsPdf()
            : userId
              ? await generateUserAssignmentsPdf(userId)
              : (() => {
                  throw new Error('No se encontró el usuario del reporte.');
                })();

      await downloadProtectedDocument(
        result.pdfUrl,
        kind === 'GENERAL'
          ? 'reporte-general-deudas.pdf'
          : kind === 'ASSIGNMENTS'
            ? 'reporte-asignaciones.pdf'
            : `reporte-cobrador-${userId}.pdf`,
      );
    },
    onSuccess: () => {
      setActionError(null);
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const filteredClients = useMemo(() => {
    const clients = debtsQuery.data?.clients || [];
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase();

    return clients
      .map((client) => {
        const clientMatches =
          !normalizedSearch ||
          client.fullName
            .toLocaleLowerCase()
            .includes(normalizedSearch) ||
          (client.alias || '')
            .toLocaleLowerCase()
            .includes(normalizedSearch) ||
          client.location
            .toLocaleLowerCase()
            .includes(normalizedSearch);

        const sales = client.sales.filter((sale) => {
          const saleMatches =
            clientMatches ||
            sale.saleNumber
              .toLocaleLowerCase()
              .includes(normalizedSearch);

          if (!saleMatches) {
            return false;
          }

          if (filter === 'OVERDUE') {
            return sale.isOverdue;
          }

          if (filter === 'UNASSIGNED') {
            return !sale.assignment;
          }

          return true;
        });

        if (sales.length === 0) {
          return null;
        }

        return {
          ...client,
          sales,
          balance: sales.reduce(
            (sum, sale) => sum + sale.balance,
            0,
          ),
          overdueBalance: sales
            .filter((sale) => sale.isOverdue)
            .reduce(
              (sum, sale) => sum + sale.balance,
              0,
            ),
        };
      })
      .filter(
        (
          client,
        ): client is CollectionDebtClient =>
          client !== null,
      );
  }, [debtsQuery.data?.clients, filter, search]);

  const userAssignments = useMemo(() => {
    const users = usersQuery.data || [];
    const sales =
      debtsQuery.data?.clients.flatMap(
        (client) => client.sales,
      ) || [];

    return users
      .map((assignedUser) => {
        const assignedSales = sales.filter(
          (sale) =>
            sale.assignment?.assignedToId ===
            assignedUser.id,
        );

        return {
          ...assignedUser,
          salesCount: assignedSales.length,
          balance: assignedSales.reduce(
            (sum, sale) => sum + sale.balance,
            0,
          ),
        };
      })
      .filter(
        (assignedUser) =>
          assignedUser.salesCount > 0,
      );
  }, [debtsQuery.data?.clients, usersQuery.data]);

  const toggleClient = (clientId: string) => {
    setExpandedClients((current) => {
      const next = new Set(current);

      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }

      return next;
    });
  };

  const openPaymentDialog = (
    client: CollectionDebtClient,
    sale: CollectionDebtSale,
  ) => {
    setPaymentSelection({
      client,
      sale,
    });
    setPaymentAmount(sale.balance.toFixed(2));
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentObservations('');
    setActionError(null);
  };

  const submitPayment = () => {
    if (!paymentSelection) {
      return;
    }

    const amount = Number(paymentAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > paymentSelection.sale.balance
    ) {
      setActionError(
        `El pago debe ser mayor a cero y no superar ${formatCurrency(
          paymentSelection.sale.balance,
        )}.`,
      );
      return;
    }

    if (
      paymentMethod !== 'CASH' &&
      paymentReference.trim().length < 3
    ) {
      setActionError('Los pagos por QR o transferencia requieren una referencia.');
      return;
    }

    paymentMutation.mutate({
      saleId: paymentSelection.sale.id,
      clientId: paymentSelection.client.id,
      amount,
      method: paymentMethod,
      reference:
        paymentReference.trim() || undefined,
      observations:
        paymentObservations.trim() || undefined,
    });
  };

  if (debtsQuery.isLoading) {
    return <Loading />;
  }

  if (debtsQuery.isError) {
    return (
      <ErrorMessage
        message={getErrorMessage(debtsQuery.error)}
      />
    );
  }

  const summary = debtsQuery.data?.summary;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800 }}
          >
            Cobranza
          </Typography>
          <Typography color="text.secondary">
            {isAdmin
              ? 'Administra las cuentas por cobrar y asigna cada venta.'
              : 'Consulta y cobra únicamente las ventas asignadas a tu usuario.'}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
        >
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                disabled={pdfMutation.isPending}
                onClick={() =>
                  pdfMutation.mutate({
                    kind: 'GENERAL',
                  })
                }
              >
                PDF deuda general
              </Button>
              <Button
                variant="contained"
                startIcon={<AssignmentIndIcon />}
                disabled={pdfMutation.isPending}
                onClick={() =>
                  pdfMutation.mutate({
                    kind: 'ASSIGNMENTS',
                  })
                }
              >
                PDF asignaciones
              </Button>
            </>
          )}

          {canDownloadOwnCollectionReport && user?.id && (
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              disabled={pdfMutation.isPending}
              onClick={() =>
                pdfMutation.mutate({
                  kind: 'USER',
                  userId: user.id,
                })
              }
            >
              Mi PDF de cobranza
            </Button>
          )}
        </Stack>
      </Stack>

      {actionError && (
        <Alert
          severity="error"
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1.5}>
              <AccountBalanceWalletIcon color="primary" />
              <Box>
                <Typography color="text.secondary">
                  Saldo general
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800 }}
                >
                  {formatCurrency(
                    summary?.totalBalance,
                  )}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={1.5}>
              <WarningAmberIcon color="error" />
              <Box>
                <Typography color="text.secondary">
                  Saldo vencido
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800 }}
                  color="error.main"
                >
                  {formatCurrency(
                    summary?.overdueBalance,
                  )}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={1.5}>
              <PaymentsIcon color="success" />
              <Box>
                <Typography color="text.secondary">
                  Total pagado
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800 }}
                >
                  {formatCurrency(
                    summary?.totalPaid,
                  )}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={1.5}>
              <PersonOffIcon color="warning" />
              <Box>
                <Typography color="text.secondary">
                  Ventas sin asignar
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800 }}
                >
                  {summary?.unassignedSalesCount || 0}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
        >
          <TextField
            fullWidth
            label="Buscar cliente, localidad o N° de venta"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon
                    sx={{
                      mr: 1,
                      color: 'text.secondary',
                    }}
                  />
                ),
              },
            }}
          />

          <TextField
            select
            label="Mostrar"
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as DebtFilter,
              )
            }
            sx={{ minWidth: 210 }}
          >
            <MenuItem value="ALL">
              Todas las deudas
            </MenuItem>
            <MenuItem value="OVERDUE">
              Solo vencidas
            </MenuItem>
            {isAdmin && (
              <MenuItem value="UNASSIGNED">
                Sin asignar
              </MenuItem>
            )}
          </TextField>
        </Stack>
      </Paper>

      {isAdmin && userAssignments.length > 0 && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800 }}
            >
              Resumen por responsable
            </Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Responsable</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell align="right">
                    Ventas
                  </TableCell>
                  <TableCell align="right">
                    Saldo asignado
                  </TableCell>
                  <TableCell align="right">
                    PDF
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userAssignments.map(
                  (assignedUser) => (
                    <TableRow key={assignedUser.id}>
                      <TableCell>
                        {assignedUser.name}
                      </TableCell>
                      <TableCell>
                        {
                          roleLabels[
                            assignedUser.role
                          ]
                        }
                      </TableCell>
                      <TableCell align="right">
                        {assignedUser.salesCount}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(
                          assignedUser.balance,
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Generar PDF individual">
                          <IconButton
                            color="primary"
                            disabled={
                              pdfMutation.isPending
                            }
                            onClick={() =>
                              pdfMutation.mutate({
                                kind: 'USER',
                                userId:
                                  assignedUser.id,
                              })
                            }
                          >
                            <FileDownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Stack spacing={2}>
        {filteredClients.map((client) => {
          const expanded = expandedClients.has(
            client.id,
          );

          return (
            <Paper key={client.id}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{
                  p: 2,
                  alignItems: {
                    xs: 'stretch',
                    md: 'center',
                  },
                }}
              >
                <IconButton
                  onClick={() =>
                    toggleClient(client.id)
                  }
                >
                  {expanded ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800 }}
                  >
                    {client.fullName}
                    {client.alias
                      ? ` (${client.alias})`
                      : ''}
                  </Typography>
                  <Typography color="text.secondary">
                    {client.location || 'Sin localidad'}
                    {client.phone
                      ? ` · ${client.phone}`
                      : ''}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: 'wrap' }}
                >
                  <Chip
                    label={`${client.sales.length} crédito(s)`}
                  />
                  {client.overdueBalance > 0 && (
                    <Chip
                      color="error"
                      label={`Vencido: ${formatCurrency(
                        client.overdueBalance,
                      )}`}
                    />
                  )}
                  <Chip
                    color="primary"
                    label={`Saldo: ${formatCurrency(
                      client.balance,
                    )}`}
                  />
                </Stack>
              </Stack>

              <Collapse in={expanded}>
                <Divider />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>N° Venta</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>
                          Vencimiento
                        </TableCell>
                        <TableCell align="right">
                          Total
                        </TableCell>
                        <TableCell align="right">
                          Pagado
                        </TableCell>
                        <TableCell align="right">
                          Saldo
                        </TableCell>
                        <TableCell>
                          Responsable
                        </TableCell>
                        <TableCell align="right">
                          Acción
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {client.sales.map((sale) => {
                        const canCollect =
                          canRegisterPayment &&
                          (isAdmin ||
                            sale.assignment?.assignedToId === user?.id);

                        return (
                          <TableRow key={sale.id}>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                  alignItems: 'center',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                  }}
                                >
                                  {sale.saleNumber}
                                </Typography>
                                {sale.isOverdue && (
                                  <Chip
                                    size="small"
                                    color="error"
                                    label="Vencida"
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {formatDate(sale.date)}
                            </TableCell>
                            <TableCell>
                              {formatDate(
                                sale.dueDate,
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                sale.total,
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(
                                sale.paidAmount,
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                sx={{
                                  fontWeight: 800,
                                }}
                              >
                                {formatCurrency(
                                  sale.balance,
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{ minWidth: 220 }}
                            >
                              {isAdmin ? (
                                <TextField
                                  select
                                  fullWidth
                                  size="small"
                                  value={
                                    sale.assignment
                                      ?.assignedToId ||
                                    ''
                                  }
                                  disabled={
                                    assignmentMutation.isPending ||
                                    usersQuery.isLoading
                                  }
                                  onChange={(event) => {
                                    const value =
                                      event.target
                                        .value;
                                    if (value === '') {
                                      const reason = requestEconomicReason(
                                        `quitar la asignación de la venta ${sale.saleNumber}`,
                                      );
                                      if (!reason) return;
                                      assignmentMutation.mutate({
                                        saleId: sale.id,
                                        assignedToId: null,
                                        reason,
                                      });
                                      return;
                                    }
                                    assignmentMutation.mutate({
                                      saleId: sale.id,
                                      assignedToId: Number(value),
                                    });
                                  }}
                                >
                                  <MenuItem value="">
                                    Sin asignar
                                  </MenuItem>
                                  {(
                                    usersQuery.data ||
                                    []
                                  ).map(
                                    (
                                      assignedUser,
                                    ) => (
                                      <MenuItem
                                        key={
                                          assignedUser.id
                                        }
                                        value={
                                          assignedUser.id
                                        }
                                      >
                                        {
                                          assignedUser.name
                                        }{' '}
                                        ·{' '}
                                        {
                                          roleLabels[
                                            assignedUser
                                              .role
                                          ]
                                        }
                                      </MenuItem>
                                    ),
                                  )}
                                </TextField>
                              ) : sale.assignment ? (
                                <Stack spacing={0.25}>
                                  <Typography
                                    sx={{
                                      fontWeight: 700,
                                    }}
                                  >
                                    {
                                      sale.assignment
                                        .assignedToName
                                    }
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {
                                      roleLabels[
                                        sale
                                          .assignment
                                          .assignedToRole
                                      ]
                                    }
                                  </Typography>
                                </Stack>
                              ) : (
                                <Chip
                                  size="small"
                                  label="Sin asignar"
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {canCollect && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<PaymentsIcon />}
                                  onClick={() =>
                                    openPaymentDialog(client, sale)
                                  }
                                >
                                  Registrar pago
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      {filteredClients.length === 0 && (
        <Alert severity="info">
          No se encontraron cuentas por cobrar con los
          filtros seleccionados.
        </Alert>
      )}

      {isAdmin && <PaymentReversalsPanel />}

      <Dialog
        open={Boolean(paymentSelection)}
        onClose={
          paymentMutation.isPending
            ? undefined
            : () => setPaymentSelection(null)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Registrar pago de crédito
        </DialogTitle>
        <DialogContent>
          {paymentSelection && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Cliente:{' '}
                <strong>
                  {paymentSelection.client.fullName}
                </strong>
                <br />
                Venta:{' '}
                <strong>
                  {
                    paymentSelection.sale
                      .saleNumber
                  }
                </strong>
                <br />
                Saldo actual:{' '}
                <strong>
                  {formatCurrency(
                    paymentSelection.sale.balance,
                  )}
                </strong>
              </Alert>

              <TextField
                label="Monto pagado"
                type="number"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value,
                  )
                }
                slotProps={{
                  htmlInput: {
                    min: 0.01,
                    max: paymentSelection.sale
                      .balance,
                    step: 0.01,
                  },
                }}
                required
              />

              <TextField
                select
                label="Método de pago"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value as PaymentMethod,
                  )
                }
              >
                {(
                  Object.keys(
                    paymentMethodLabels,
                  ) as PaymentMethod[]
                ).map((method) => (
                  <MenuItem
                    key={method}
                    value={method}
                  >
                    {
                      paymentMethodLabels[
                        method
                      ]
                    }
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Referencia"
                value={paymentReference}
                onChange={(event) =>
                  setPaymentReference(
                    event.target.value,
                  )
                }
                required={paymentMethod !== 'CASH'}
                helperText={
                  paymentMethod === 'CASH'
                    ? 'Opcional para pagos en efectivo.'
                    : 'Obligatorio: número de transferencia o comprobante.'
                }
              />

              <TextField
                label="Observaciones"
                value={paymentObservations}
                onChange={(event) =>
                  setPaymentObservations(
                    event.target.value,
                  )
                }
                multiline
                minRows={2}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() =>
              setPaymentSelection(null)
            }
            disabled={paymentMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submitPayment}
            disabled={paymentMutation.isPending}
          >
            {paymentMutation.isPending
              ? 'Guardando...'
              : 'Confirmar pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
