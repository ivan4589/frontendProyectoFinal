import { Alert } from '@mui/material';

interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({
  message = 'Ocurrió un error inesperado',
}: ErrorMessageProps) {
  return <Alert severity="error">{message}</Alert>;
}