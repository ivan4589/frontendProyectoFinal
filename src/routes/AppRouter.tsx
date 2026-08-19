import type { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes, useLocation } from 'react-router';
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
import {
  hasAnyPermission,
  PERMISSIONS,
  type Permission,
} from '../features/auth/permissions';
import { SecuritySettingsPage } from '../features/auth/SecuritySettingsPage';
import { SecureLoginPage } from '../features/auth/SecureLoginPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { CollectionsPage } from '../features/collections/CollectionsPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { PrivacyPolicyPage } from '../features/legal/PrivacyPolicyPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { AccessDeniedPage } from '../features/not-found/AccessDeniedPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { ProvidersPage } from '../features/providers/ProvidersPage';
import { PurchasesPage } from '../features/purchases/PurchasesPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SalesPage } from '../features/sales/SalesPage';
import { WarehouseTransfersPage } from '../features/warehouse-transfers/WarehouseTransfersPage';

function LoadingSession() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();
  if (initializing) return <LoadingSession />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword && location.pathname !== '/security') {
    return <Navigate to="/security?required=password" replace />;
  }
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <LoadingSession />;
  return isAuthenticated ? <HomeRedirect /> : <>{children}</>;
}

function RequirePermission({
  permissions,
  children,
}: {
  permissions: Permission[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  return hasAnyPermission(user?.role, permissions) ? (
    <>{children}</>
  ) : (
    <AccessDeniedPage />
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.mustChangePassword) {
    return <Navigate to="/security?required=password" replace />;
  }
  const destination = user?.role === 'COBRADOR' ? '/collections' : '/dashboard';
  return <Navigate to={destination} replace />;
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
      <Route path="/politica-de-privacidad" element={<PrivacyPolicyPage />} />

      <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<RequirePermission permissions={[PERMISSIONS.DASHBOARD_VIEW]}><DashboardPage /></RequirePermission>} />
        <Route path="clients" element={<RequirePermission permissions={[PERMISSIONS.CLIENTS_VIEW]}><ClientsPage /></RequirePermission>} />
        <Route path="providers" element={<RequirePermission permissions={[PERMISSIONS.PROVIDERS_VIEW]}><ProvidersPage /></RequirePermission>} />
        <Route path="products" element={<RequirePermission permissions={[PERMISSIONS.PRODUCTS_VIEW]}><ProductsPage /></RequirePermission>} />
        <Route path="inventory" element={<RequirePermission permissions={[PERMISSIONS.INVENTORY_VIEW]}><InventoryPage /></RequirePermission>} />
        <Route path="purchases" element={<RequirePermission permissions={[PERMISSIONS.PURCHASES_VIEW]}><PurchasesPage /></RequirePermission>} />
        <Route path="warehouse-transfers" element={<RequirePermission permissions={[PERMISSIONS.INVENTORY_TRANSFER]}><WarehouseTransfersPage /></RequirePermission>} />
        <Route path="sales" element={<RequirePermission permissions={[PERMISSIONS.SALES_VIEW_ALL, PERMISSIONS.SALES_VIEW_ASSIGNED]}><SalesPage /></RequirePermission>} />
        <Route path="collections" element={<RequirePermission permissions={[PERMISSIONS.COLLECTIONS_VIEW_ALL, PERMISSIONS.COLLECTIONS_VIEW_OWN_SALES, PERMISSIONS.COLLECTIONS_VIEW_ASSIGNED]}><CollectionsPage /></RequirePermission>} />
        <Route path="reports" element={<RequirePermission permissions={[PERMISSIONS.REPORTS_FINANCIAL, PERMISSIONS.REPORTS_SALES_ALL, PERMISSIONS.REPORTS_INVENTORY]}><ReportsPage /></RequirePermission>} />
        <Route path="security" element={<RequirePermission permissions={[PERMISSIONS.SECURITY_SELF_MANAGE]}><SecuritySettingsPage /></RequirePermission>} />
        <Route path="administration" element={<RequirePermission permissions={[PERMISSIONS.USERS_MANAGE]}><AdministrationPage /></RequirePermission>} />
        <Route path="administration/registration-requests" element={<RequirePermission permissions={[PERMISSIONS.USERS_MANAGE]}><RegistrationRequestsPage /></RequirePermission>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
