import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { useState } from 'react';
import type {
  SpreadsheetImportPreview,
  SpreadsheetImportResult,
} from '../../types/spreadsheet.types';

interface SpreadsheetImportDialogProps {
  open: boolean;
  title: string;
  entityLabel: string;
  onClose: () => void;
  onDownloadTemplate: () => Promise<void>;
  onPreview: (file: File) => Promise<SpreadsheetImportPreview>;
  onImport: (file: File) => Promise<SpreadsheetImportResult>;
  onImported: (result: SpreadsheetImportResult) => void;
}

function errorMessage(error: unknown) {
  const requestError = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = requestError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || requestError.message || 'No se pudo procesar el archivo.';
}

const actionLabels = {
  CREATE: 'Nuevo',
  UPDATE: 'Actualizar',
  UNCHANGED: 'Sin cambios',
} as const;

export function SpreadsheetImportDialog({
  open,
  title,
  entityLabel,
  onClose,
  onDownloadTemplate,
  onPreview,
  onImport,
  onImported,
}: SpreadsheetImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SpreadsheetImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setPreview(await onPreview(file));
    } catch (requestError) {
      setPreview(null);
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!file || !preview?.valid) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onImport(file);
      reset();
      onImported(result);
    } catch (requestError) {
      const response = requestError as {
        response?: { data?: { preview?: SpreadsheetImportPreview } };
      };
      if (response.response?.data?.preview) {
        setPreview(response.response.data.preview);
      }
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : close} fullWidth maxWidth="lg">
      <DialogTitle>{title}</DialogTitle>
      {loading && <LinearProgress />}
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info">
            Descarga la plantilla, conserva sus columnas y carga un archivo .xlsx.
            Primero se mostrará una vista previa; no se guardará nada hasta que
            confirmes y todas las filas sean válidas.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => onDownloadTemplate().catch((value) => setError(errorMessage(value)))}
              disabled={loading}
            >
              Descargar plantilla
            </Button>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={loading}>
              Seleccionar Excel
              <input
                hidden
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const selected = event.target.files?.[0] || null;
                  setFile(selected);
                  setPreview(null);
                  setError(null);
                  event.target.value = '';
                }}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<FactCheckIcon />}
              onClick={analyze}
              disabled={!file || loading}
            >
              Analizar archivo
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {file.name}
              </Typography>
            )}
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {preview && (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                  gap: 1.5,
                }}
              >
                {[
                  ['Filas', preview.summary.totalRows],
                  ['Nuevos', preview.summary.created],
                  ['Actualizaciones', preview.summary.updated],
                  ['Sin cambios', preview.summary.unchanged],
                  ['Errores', preview.summary.errors],
                ].map(([label, value]) => (
                  <Paper key={String(label)} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="h6" fontWeight={800}>{value}</Typography>
                  </Paper>
                ))}
              </Box>

              <Alert severity={preview.valid ? 'success' : 'warning'}>
                {preview.valid
                  ? `El archivo está listo para importar ${entityLabel}.`
                  : 'Corrige las filas marcadas y vuelve a analizar el archivo.'}
              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fila</TableCell>
                      <TableCell>Acción</TableCell>
                      <TableCell>Registro</TableCell>
                      <TableCell>Identificador</TableCell>
                      <TableCell>Validación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={`${row.row}-${row.identifier}`}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={actionLabels[row.action]}
                            color={row.action === 'CREATE' ? 'success' : row.action === 'UPDATE' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{row.displayName}</TableCell>
                        <TableCell>{row.identifier}</TableCell>
                        <TableCell>
                          {row.errors.length ? (
                            <Typography variant="body2" color="error.main">
                              {row.errors.join(' · ')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="success.main">Correcto</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={loading}>Cancelar</Button>
        <Button variant="contained" onClick={confirm} disabled={!preview?.valid || loading}>
          Confirmar importación
        </Button>
      </DialogActions>
    </Dialog>
  );
}
