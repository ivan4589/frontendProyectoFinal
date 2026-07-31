from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        if new in text:
            return
        raise SystemExit(f'No se encontró bloque en {path}: {old[:140]!r}')
    file.write_text(text.replace(old, new, count), encoding='utf-8')


# ---------------------------------------------------------------------------
# Ventas y devoluciones
# ---------------------------------------------------------------------------
replace(
    'src/features/sales/SalesPage.tsx',
    "import { getImageUrl } from '../../utils/getImageUrl';\n",
    "import { getImageUrl } from '../../utils/getImageUrl';\nimport { requestEconomicReason } from '../../utils/economicOperation';\n",
)
replace(
    'src/features/sales/SalesPage.tsx',
    '''  const cancelMutation = useMutation({
    mutationFn: cancelSale,
''',
    '''  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelSale(id, reason),
''',
)
replace(
    'src/features/sales/SalesPage.tsx',
    '''  const handleCancelSale = (
    sale: Sale,
  ) => {
    const confirmed =
      window.confirm(
        `¿Anular la venta ${sale.saleNumber}? La venta continuará en el historial.`,
      );

    if (!confirmed) {
      return;
    }

    cancelMutation.mutate(
      sale.id,
    );
  };
''',
    '''  const handleCancelSale = (sale: Sale) => {
    const reason = requestEconomicReason(
      `anular la venta ${sale.saleNumber}`,
    );
    if (!reason) return;

    cancelMutation.mutate({ id: sale.id, reason });
  };
''',
)

replace(
    'src/features/sales/SaleReturnDialog.tsx',
    '''    onSubmit({
      details,
      observations:
        observations.trim() ||
        undefined,
    });
''',
    '''    const reason = observations.trim();
    if (reason.length < 10) {
      setLocalError('El motivo de la devolución debe tener al menos 10 caracteres');
      return;
    }

    onSubmit({
      details,
      observations: reason,
    });
''',
)
replace(
    'src/features/sales/SaleReturnDialog.tsx',
    '''          label="Motivo u observaciones"
          value={observations}
''',
    '''          label="Motivo de la devolución"
          value={observations}
          required
          helperText="Obligatorio, entre 10 y 500 caracteres."
          slotProps={{ htmlInput: { maxLength: 500 } }}
''',
)

# ---------------------------------------------------------------------------
# Compras
# ---------------------------------------------------------------------------
replace(
    'src/features/purchases/PurchasesPage.tsx',
    "import { formatDate } from '../../utils/formatDate';\n",
    "import { formatDate } from '../../utils/formatDate';\nimport { requestEconomicReason } from '../../utils/economicOperation';\n",
)
replace(
    'src/features/purchases/PurchasesPage.tsx',
    '''  const cancelProviderMutation = useMutation({
    mutationFn: ({
      purchaseId,
      providerGroupId,
    }: {
      purchaseId: string;
      providerGroupId: string;
    }) =>
      cancelPurchaseProvider(purchaseId, providerGroupId),
''',
    '''  const cancelProviderMutation = useMutation({
    mutationFn: ({
      purchaseId,
      providerGroupId,
      reason,
    }: {
      purchaseId: string;
      providerGroupId: string;
      reason: string;
    }) =>
      cancelPurchaseProvider(purchaseId, providerGroupId, reason),
''',
)
replace(
    'src/features/purchases/PurchasesPage.tsx',
    '''  const cancelPurchaseMutation = useMutation({
    mutationFn: cancelPurchase,
''',
    '''  const cancelPurchaseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelPurchase(id, reason),
''',
)
replace(
    'src/features/purchases/PurchasesPage.tsx',
    '''    if (confirmAction.kind === 'CANCEL_PROVIDER') {
      cancelProviderMutation.mutate({
        purchaseId: confirmAction.purchase.id,
        providerGroupId: confirmAction.providerGroup.id,
      });

      return;
    }

    cancelPurchaseMutation.mutate(
      confirmAction.purchase.id,
    );
''',
    '''    if (confirmAction.kind === 'CANCEL_PROVIDER') {
      const reason = requestEconomicReason(
        `anular al proveedor ${confirmAction.providerGroup.providerName}`,
      );
      if (!reason) return;
      cancelProviderMutation.mutate({
        purchaseId: confirmAction.purchase.id,
        providerGroupId: confirmAction.providerGroup.id,
        reason,
      });
      return;
    }

    const reason = requestEconomicReason(
      `anular la compra #${confirmAction.purchase.id.slice(0, 8)}`,
    );
    if (!reason) return;
    cancelPurchaseMutation.mutate({
      id: confirmAction.purchase.id,
      reason,
    });
''',
)

# ---------------------------------------------------------------------------
# Transferencias
# ---------------------------------------------------------------------------
replace(
    'src/features/warehouse-transfers/WarehouseTransfersPage.tsx',
    "import { formatDateTime } from '../../utils/formatDate';\n",
    "import { formatDateTime } from '../../utils/formatDate';\nimport { requestEconomicReason } from '../../utils/economicOperation';\n",
)
replace(
    'src/features/warehouse-transfers/WarehouseTransfersPage.tsx',
    '''  const cancelMutation = useMutation({
    mutationFn: cancelWarehouseTransfer,
''',
    '''  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelWarehouseTransfer(id, reason),
''',
)
replace(
    'src/features/warehouse-transfers/WarehouseTransfersPage.tsx',
    '''              if (transferToCancel) {
                cancelMutation.mutate(transferToCancel.id);
              }
''',
    '''              if (transferToCancel) {
                const reason = requestEconomicReason(
                  `anular la transferencia ${transferToCancel.transferNumber}`,
                );
                if (reason) {
                  cancelMutation.mutate({ id: transferToCancel.id, reason });
                }
              }
''',
)

# ---------------------------------------------------------------------------
# Cobranzas y pagos
# ---------------------------------------------------------------------------
replace(
    'src/features/collections/CollectionsPage.tsx',
    "import { formatDate } from '../../utils/formatDate';\n",
    "import { formatDate } from '../../utils/formatDate';\nimport { requestEconomicReason } from '../../utils/economicOperation';\nimport { PaymentReversalsPanel } from './PaymentReversalsPanel';\n",
)
replace(
    'src/features/collections/CollectionsPage.tsx',
    '''      assignedToId,
    }: {
      saleId: string;
      assignedToId: number | null;
    }) => {
      if (assignedToId === null) {
        return unassignCollection(saleId);
      }
''',
    '''      assignedToId,
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
''',
)
replace(
    'src/features/collections/CollectionsPage.tsx',
    '''                                    assignmentMutation.mutate(
                                      {
                                        saleId:
                                          sale.id,
                                        assignedToId:
                                          value === ''
                                            ? null
                                            : Number(
                                                value,
                                              ),
                                      },
                                    );
''',
    '''                                    if (value === '') {
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
''',
)
replace(
    'src/features/collections/CollectionsPage.tsx',
    '''    paymentMutation.mutate({
      saleId: paymentSelection.sale.id,
''',
    '''    if (
      paymentMethod !== 'CASH' &&
      paymentReference.trim().length < 3
    ) {
      setActionError('Los pagos por QR o transferencia requieren una referencia.');
      return;
    }

    paymentMutation.mutate({
      saleId: paymentSelection.sale.id,
''',
)
replace(
    'src/features/collections/CollectionsPage.tsx',
    '''                helperText="Opcional. Ej.: número de transferencia o comprobante."
''',
    '''                required={paymentMethod !== 'CASH'}
                helperText={
                  paymentMethod === 'CASH'
                    ? 'Opcional para pagos en efectivo.'
                    : 'Obligatorio: número de transferencia o comprobante.'
                }
''',
)
replace(
    'src/features/collections/CollectionsPage.tsx',
    '''      <Dialog
        open={Boolean(paymentSelection)}
''',
    '''      {isAdmin && <PaymentReversalsPanel />}

      <Dialog
        open={Boolean(paymentSelection)}
''',
)

# ---------------------------------------------------------------------------
# Ajustes administrativos de inventario
# ---------------------------------------------------------------------------
replace(
    'src/features/inventory/InventoryPage.tsx',
    'import { useMutation, useQuery } from \'@tanstack/react-query\';\n',
    'import { useMutation, useQuery, useQueryClient } from \'@tanstack/react-query\';\n',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''  generateCentralInventoryPdf,
  getCentralInventory,
''',
    '''  adjustInventory,
  generateCentralInventoryPdf,
  getCentralInventory,
''',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    "import { Loading } from '../../components/common/Loading';\n",
    "import { Loading } from '../../components/common/Loading';\nimport { useAuth } from '../auth/AuthContext';\nimport { requestEconomicReason, requestInventoryQuantityChange } from '../../utils/economicOperation';\n",
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''export function InventoryPage() {
  const inventoryQuery = useQuery({
''',
    '''export function InventoryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const inventoryQuery = useQuery({
''',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''  const pdfMutation = useMutation({
    mutationFn: generateCentralInventoryPdf,
    onSuccess: (result) => openPdf(result.pdfUrl),
  });
''',
    '''  const pdfMutation = useMutation({
    mutationFn: generateCentralInventoryPdf,
    onSuccess: (result) => openPdf(result.pdfUrl),
  });
  const adjustmentMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const handleAdjustment = (warehouseId: string, productId: string, name: string) => {
    const quantityChange = requestInventoryQuantityChange();
    if (quantityChange === null) return;
    const reason = requestEconomicReason(`ajustar el inventario de ${name}`);
    if (!reason) return;
    adjustmentMutation.mutate({ warehouseId, productId, quantityChange, reason });
  };
''',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''      {pdfMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(pdfMutation.error)}
        </Alert>
      )}
''',
    '''      {pdfMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(pdfMutation.error)}
        </Alert>
      )}
      {adjustmentMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(adjustmentMutation.error)}
        </Alert>
      )}
''',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''                                  <TableCell align="right">
                                    Disponible
                                  </TableCell>
''',
    '''                                  <TableCell align="right">
                                    Disponible
                                  </TableCell>
                                  <TableCell align="right">Acción</TableCell>
''',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''                                      <TableCell align="right">
                                        <Chip
                                          color={
                                            product.availableStock >
                                            0
                                              ? 'success'
                                              : 'default'
                                          }
                                          label={formatQuantity(
                                            product.availableStock,
                                          )}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
''',
    '''                                      <TableCell align="right">
                                        <Chip
                                          color={product.availableStock > 0 ? 'success' : 'default'}
                                          label={formatQuantity(product.availableStock)}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        {isAdmin ? (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={adjustmentMutation.isPending}
                                            onClick={() =>
                                              handleAdjustment(
                                                inventory.warehouse.id,
                                                product.productId,
                                                product.name,
                                              )
                                            }
                                          >
                                            Ajustar
                                          </Button>
                                        ) : '—'}
                                      </TableCell>
''',
)
replace(
    'src/features/inventory/InventoryPage.tsx',
    '''                                  <TableCell
                                    align="right"
                                    sx={{
                                      fontWeight: 800,
                                    }}
                                  >
                                    {formatQuantity(
                                      category.totalAvailableStock,
                                    )}
                                  </TableCell>
''',
    '''                                  <TableCell
                                    align="right"
                                    sx={{ fontWeight: 800 }}
                                  >
                                    {formatQuantity(category.totalAvailableStock)}
                                  </TableCell>
                                  <TableCell />
''',
)
