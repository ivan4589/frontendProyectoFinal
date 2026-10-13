import { Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useState } from 'react';
import type { CentralInventorySubCategory } from '../../types/inventory.types';

export interface InventorySubcategoryProps {
  group: CentralInventorySubCategory;
  idPrefix: string;
  isAdmin: boolean;
  loading: boolean;
  onAdjust: (productId: string, name: string) => void;
  defaultExpanded?: boolean;
}
const quantity = (value: number) => new Intl.NumberFormat('es-BO', { maximumFractionDigits: 3 }).format(value);

export function InventorySubcategory({ group, idPrefix, isAdmin, loading, onAdjust, defaultExpanded = true }: InventorySubcategoryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = `${idPrefix}-subcategory-${group.subCategoryId === null ? 'none' : `id-${encodeURIComponent(group.subCategoryId)}`}`;
  return (
    <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}
      style={{ margin: 12, border: '1px solid #d6dde5', borderRadius: 6 }}>
      <summary id={`${id}-summary`} aria-controls={`${id}-products`} aria-expanded={expanded}
        style={{ padding: 12, cursor: 'pointer', fontWeight: 700 }}>
        Subcategoría: {group.subCategoryName} — {group.products.length} productos
        <span style={{ display: 'block', paddingTop: 6, fontSize: 13, fontWeight: 400 }}>
          Stock actual: {quantity(group.totalStock)} · Reservado: {quantity(group.totalReservedStock)} · Disponible: {quantity(group.totalAvailableStock)}
        </span>
      </summary>
      <TableContainer id={`${id}-products`} aria-labelledby={`${id}-summary`}>
        <Table size="small" aria-label={`Productos de ${group.subCategoryName}`}>
          <TableHead><TableRow>
            <TableCell>Código</TableCell><TableCell>Producto</TableCell><TableCell>Presentación</TableCell>
            <TableCell align="right">Stock actual</TableCell><TableCell align="right">Reservado</TableCell>
            <TableCell align="right">Disponible</TableCell><TableCell align="right">Acción</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {group.products.map(product => <TableRow key={product.productId} data-product-id={product.productId} hover>
              <TableCell><code>{product.code}</code></TableCell><TableCell>{product.name}</TableCell>
              <TableCell>{product.presentation || product.unit}</TableCell>
              <TableCell align="right">{quantity(product.stock)}</TableCell>
              <TableCell align="right">{quantity(product.reservedStock)}</TableCell>
              <TableCell align="right"><Chip size="small" variant="outlined" color={product.availableStock > 0 ? 'success' : 'default'} label={quantity(product.availableStock)} /></TableCell>
              <TableCell align="right">{isAdmin ? <Button size="small" variant="outlined" disabled={loading}
                onClick={() => onAdjust(product.productId, product.name)} aria-label={`Ajustar ${product.name}`}>Ajustar</Button> : '—'}</TableCell>
            </TableRow>)}
            <TableRow><TableCell colSpan={3}>Subtotal {group.subCategoryName}</TableCell>
              <TableCell align="right">{quantity(group.totalStock)}</TableCell>
              <TableCell align="right">{quantity(group.totalReservedStock)}</TableCell>
              <TableCell align="right">{quantity(group.totalAvailableStock)}</TableCell><TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </details>
  );
}
