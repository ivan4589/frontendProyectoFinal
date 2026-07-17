import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Cargando...' }: LoadingProps) {
  return (
    <Box
      sx={{
        minHeight: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}