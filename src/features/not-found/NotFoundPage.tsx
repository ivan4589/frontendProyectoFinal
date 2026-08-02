import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h3">404</Typography>

      <Typography color="text.secondary">
        La página que buscas no existe.
      </Typography>

      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Volver al dashboard
      </Button>
    </Box>
  );
}