import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button, Container, Stack, Typography } from '@mui/material';
import { reportClientError } from '../../monitoring/reportError';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, {
      source: 'react.error-boundary',
      path: info.componentStack || undefined,
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Stack spacing={3}>
          <Typography variant="h4">No pudimos mostrar esta pantalla</Typography>
          <Alert severity="error">
            El incidente fue registrado. Recarga la aplicación y vuelve a intentarlo.
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Recargar aplicación
          </Button>
        </Stack>
      </Container>
    );
  }
}
