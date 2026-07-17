import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { ProvidersPage } from '../features/providers/ProvidersPage';
import { useAuth } from '../features/auth/AuthContext';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>Este módulo será implementado después.</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<PlaceholderPage title="Clientes" />} />
        <Route path="products" element={<PlaceholderPage title="Productos" />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="purchases" element={<PlaceholderPage title="Compras" />} />
        <Route path="sales" element={<PlaceholderPage title="Ventas" />} />
        <Route path="reports" element={<PlaceholderPage title="Reportes" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}