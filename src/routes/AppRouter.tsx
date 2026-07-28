import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { AdministrationPage } from '../features/administration/AdministrationPage';
import { RegistrationRequestsPage } from '../features/administration/RegistrationRequestsPage';
import {
  ForgotPasswordPage,
  RegisterPage,
  ResetPasswordPage,
  TwoFactorPage,
  VerifyEmailPage,
} from '../features/auth/AuthSecurityPages';
import { useAuth } from '../features/auth/AuthContext';
import { SecureLoginPage } from '../features/auth/SecureLoginPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { CollectionsPage } from '../features/collections/CollectionsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { ProvidersPage } from '../features/providers/ProvidersPage';
import { PurchasesPage } from '../features/purchases/PurchasesPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SalesPage } from '../features/sales/SalesPage';
import { WarehouseTransfersPage } from '../features/warehouse-transfers/WarehouseTransfersPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><SecureLoginPage /></PublicOnly>} />
      <Route path="/registro" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/verificar-correo" element={<PublicOnly><VerifyEmailPage /></PublicOnly>} />
      <Route path="/recuperar-contrasena" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      <Route path="/restablecer-contrasena" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
      <Route path="/segundo-factor" element={<PublicOnly><TwoFactorPage /></PublicOnly>} />

      <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="warehouse-transfers" element={<RequireAdmin><WarehouseTransfersPage /></RequireAdmin>} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="administration" element={<RequireAdmin><AdministrationPage /></RequireAdmin>} />
        <Route path="administration/registration-requests" element={<RequireAdmin><RegistrationRequestsPage /></RequireAdmin>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
