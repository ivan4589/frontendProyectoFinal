import type { ReactNode } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SecurityIcon from '@mui/icons-material/Security';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import {
  hasAnyPermission,
  PERMISSIONS,
  type Permission,
} from '../../features/auth/permissions';

const drawerWidth = 260;

type MenuItem = {
  text: string;
  path: string;
  icon: ReactNode;
  permissions: Permission[];
};

const menuItems: MenuItem[] = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { text: 'Clientes', path: '/clients', icon: <PeopleIcon />, permissions: [PERMISSIONS.CLIENTS_VIEW] },
  { text: 'Proveedores', path: '/providers', icon: <LocalShippingIcon />, permissions: [PERMISSIONS.PROVIDERS_VIEW] },
  { text: 'Productos', path: '/products', icon: <InventoryIcon />, permissions: [PERMISSIONS.PRODUCTS_VIEW] },
  { text: 'Inventario', path: '/inventory', icon: <Inventory2Icon />, permissions: [PERMISSIONS.INVENTORY_VIEW] },
  { text: 'Compras', path: '/purchases', icon: <ShoppingCartIcon />, permissions: [PERMISSIONS.PURCHASES_VIEW] },
  { text: 'Transferencias', path: '/warehouse-transfers', icon: <SwapHorizIcon />, permissions: [PERMISSIONS.INVENTORY_TRANSFER] },
  { text: 'Ventas', path: '/sales', icon: <ReceiptIcon />, permissions: [PERMISSIONS.SALES_VIEW_ALL, PERMISSIONS.SALES_VIEW_ASSIGNED] },
  {
    text: 'Cobranza',
    path: '/collections',
    icon: <AccountBalanceWalletIcon />,
    permissions: [
      PERMISSIONS.COLLECTIONS_VIEW_ALL,
      PERMISSIONS.COLLECTIONS_VIEW_OWN_SALES,
      PERMISSIONS.COLLECTIONS_VIEW_ASSIGNED,
    ],
  },
  {
    text: 'Reportes',
    path: '/reports',
    icon: <AssessmentIcon />,
    permissions: [PERMISSIONS.REPORTS_FINANCIAL, PERMISSIONS.REPORTS_SALES_ALL, PERMISSIONS.REPORTS_INVENTORY],
  },
  { text: 'Mi seguridad', path: '/security', icon: <SecurityIcon />, permissions: [PERMISSIONS.SECURITY_SELF_MANAGE] },
  { text: 'Administración', path: '/administration', icon: <AdminPanelSettingsIcon />, permissions: [PERMISSIONS.USERS_MANAGE] },
];

export function MainLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userLabel = user?.name || user?.email || 'Usuario';
  const visibleMenuItems = menuItems.filter((item) => {
    if (user?.mustChangePassword) return item.path === '/security';
    return hasAnyPermission(user?.role, item.permissions);
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#063f2d' }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Yungas Distribuidora
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0b6b4a' }}>
              {userLabel.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ lineHeight: 1.1 }}>{userLabel}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{user?.role || 'Sin rol'}</Typography>
            </Box>
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Salir</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
          <Box
            component="img"
            src="/brand/logo-yungas.jpeg"
            alt="Yungas Distribuidora"
            sx={{ width: 70, height: 70, objectFit: 'contain', mb: 1 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Yungas Distribuidora</Typography>
          <Typography variant="caption" color="text.secondary">Ventas e Inventarios</Typography>
        </Box>

        {user?.mustChangePassword && (
          <Alert severity="warning" sx={{ mx: 1.5, mb: 1 }}>
            Cambia la contraseña temporal para habilitar los módulos.
          </Alert>
        )}

        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {visibleMenuItems.map((item) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.active': {
                    backgroundColor: '#063f2d',
                    color: '#ffffff',
                    '& .MuiListItemIcon-root': { color: '#ffffff' },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}><Outlet /></Container>
      </Box>
    </Box>
  );
}
