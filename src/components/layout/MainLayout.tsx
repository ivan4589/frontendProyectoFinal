import {
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
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const drawerWidth = 260;

const menuItems = [
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    text: 'Clientes',
    path: '/clients',
    icon: <PeopleIcon />,
  },
  {
    text: 'Proveedores',
    path: '/providers',
    icon: <LocalShippingIcon />,
  },
  {
    text: 'Productos',
    path: '/products',
    icon: <InventoryIcon />,
  },
  {
    text: 'Inventario',
    path: '/inventory',
    icon: <Inventory2Icon />,
  },
  {
    text: 'Compras',
    path: '/purchases',
    icon: <ShoppingCartIcon />,
  },
  {
    text: 'Transferencias',
    path: '/warehouse-transfers',
    icon: <SwapHorizIcon />,
    adminOnly: true,
  },
  {
    text: 'Ventas',
    path: '/sales',
    icon: <ReceiptIcon />,
  },
  {
    text: 'Cobranza',
    path: '/collections',
    icon: <AccountBalanceWalletIcon />,
  },
  {
    text: 'Reportes',
    path: '/reports',
    icon: <AssessmentIcon />,
  },
  {
    text: 'Administración',
    path: '/administration',
    icon: <AdminPanelSettingsIcon />,
    adminOnly: true,
  },
];

export function MainLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userLabel = user?.name || user?.email || 'Usuario';
  const visibleMenuItems = menuItems.filter(
    (item) =>
      !item.adminOnly || user?.role === 'ADMIN',
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#063f2d',
        }}
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
              <Typography variant="body2" sx={{ lineHeight: 1.1 }}>
                {userLabel}
              </Typography>

              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.role || 'Sin rol'}
              </Typography>
            </Box>

            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Salir
            </Button>
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
            sx={{
              width: 70,
              height: 70,
              objectFit: 'contain',
              mb: 1,
            }}
          />

          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Yungas Distribuidora
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Ventas e Inventarios
          </Typography>
        </Box>

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
                    '& .MuiListItemIcon-root': {
                      color: '#ffffff',
                    },
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
