import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import App from './App';
import { theme } from './app/theme';
import { queryClient } from './app/queryClient';
import { AuthProvider } from './features/auth/AuthContext';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { installGlobalErrorMonitoring } from './monitoring/reportError';
import './index.css';

installGlobalErrorMonitoring();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
