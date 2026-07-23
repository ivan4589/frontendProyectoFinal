import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import { MainLayout } from '../components/layout/MainLayout';

import { LoginPage } from '../features/auth/LoginPage';
import { useAuth } from '../features/auth/AuthContext';

import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { ProvidersPage } from '../features/providers/ProvidersPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { PurchasesPage } from '../features/purchases/PurchasesPage';
import { SalesPage } from '../features/sales/SalesPage';
import { CollectionsPage } from '../features/collections/CollectionsPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';

function RequireAuth({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnly({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div>
      <h1>{title}</h1>

      <p>
        Este módulo será implementado después.
      </p>
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
        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="clients"
          element={<ClientsPage />}
        />

        <Route
          path="providers"
          element={<ProvidersPage />}
        />

        <Route
          path="products"
          element={<ProductsPage />}
        />

        <Route
          path="purchases"
          element={<PurchasesPage />}
        />

        <Route
          path="sales"
          element={<SalesPage />}
        />

        <Route
          path="collections"
          element={<CollectionsPage />}
        />

        <Route
          path="reports"
          element={
            <PlaceholderPage title="Reportes" />
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}
