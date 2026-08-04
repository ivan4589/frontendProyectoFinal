import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

export function AccessDeniedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={2} sx={{ maxWidth: 520 }}>
        <Typography variant="h4">Acceso denegado</Typography>
        <Alert severity="warning">
          Tu cuenta no tiene permisos para consultar este módulo. Si necesitas acceso,
          solicítalo a un administrador.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/', { replace: true })}>
          Volver al inicio
        </Button>
      </Stack>
    </Box>
  );
}
