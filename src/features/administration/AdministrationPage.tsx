import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import KeyIcon from '@mui/icons-material/Key';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSystemUser,
  getSystemUsers,
  getUserAdministrationLog,
  resetSystemUserPassword,
  updateSystemUser,
  updateSystemUserStatus,
} from '../../api/administration.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import type {
  CreateSystemUserRequest,
  SystemUser,
  UpdateSystemUserRequest,
  UserAdministrationAction,
} from '../../types/administration.types';
import type { UserRole } from '../../types/auth.types';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { useAuth } from '../auth/AuthContext';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { UserFormDialog } from './UserFormDialog';

type RoleFilter = UserRole | 'ALL';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  COBRADOR: 'Cobrador',
};

const actionLabels: Record<UserAdministrationAction, string> = {
  USER_CREATED: 'Creó un usuario',
  USER_UPDATED: 'Actualizó datos',
  ROLE_CHANGED: 'Cambió el rol',
  STATUS_CHANGED: 'Cambió el estado',
  PASSWORD_RESET: 'Restableció la contraseña',
};

function getErrorMessage(error: unknown) {
  const apiError = error as {
    response?: {
      status?: number;
      data?: { message?: string | string[] };
    };
    message?: string;
  };
  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (apiError.response?.status === 403) {
    return 'Solo un administrador puede realizar esta acción.';
  }

  return apiError.message ?? 'Ocurrió un error inesperado.';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function getRoleColor(role: UserRole) {
  if (role === 'ADMIN') return 'error' as const;
  if (role === 'COBRADOR') return 'warning' as const;
  return 'success' as const;
}

export function AdministrationPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<SystemUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['administration', 'users'],
    queryFn: getSystemUsers,
  });

  const auditQuery = useQuery({
    queryKey: ['administration', 'audit'],
    queryFn: getUserAdministrationLog,
  });

  const invalidateAdministration = () => {
    queryClient.invalidateQueries({ queryKey: ['administration'] });
  };

  const createMutation = useMutation({
    mutationFn: createSystemUser,
    onSuccess: (createdUser) => {
      invalidateAdministration();
      setFormOpen(false);
      setSelectedUser(null);
      setFormError(null);
      setActionError(null);
      setSuccessMessage(`Usuario ${createdUser.name} creado correctamente.`);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSystemUserRequest;
    }) => updateSystemUser(id, data),
    onSuccess: (updatedUser) => {
      invalidateAdministration();
      setFormOpen(false);
      setSelectedUser(null);
      setFormError(null);
      setActionError(null);
      setSuccessMessage(`Usuario ${updatedUser.name} actualizado.`);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: number;
      isActive: boolean;
    }) => updateSystemUserStatus(id, isActive),
    onSuccess: (updatedUser) => {
      invalidateAdministration();
      setActionError(null);
      setSuccessMessage(
        `${updatedUser.name} quedó ${
          updatedUser.isActive ? 'activo' : 'inactivo'
        }.`,
      );
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const passwordMutation = useMutation({
    mutationFn: ({
      id,
      password,
    }: {
      id: number;
      password: string;
    }) => resetSystemUserPassword(id, password),
    onSuccess: () => {
      invalidateAdministration();
      setPasswordUser(null);
      setFormError(null);
      setActionError(null);
      setSuccessMessage('Contraseña restablecida correctamente.');
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const filteredUsers = useMemo(() => {
    const text = search.trim().toLowerCase();

    return users.filter((systemUser) => {
      const matchesSearch =
        !text ||
        systemUser.name.toLowerCase().includes(text) ||
        systemUser.email.toLowerCase().includes(text);
      const matchesRole =
        roleFilter === 'ALL' || systemUser.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE'
          ? systemUser.isActive
          : !systemUser.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const totals = useMemo(
    () => ({
      active: users.filter((systemUser) => systemUser.isActive).length,
      inactive: users.filter((systemUser) => !systemUser.isActive).length,
      administrators: users.filter(
        (systemUser) =>
          systemUser.isActive && systemUser.role === 'ADMIN',
      ).length,
    }),
    [users],
  );

  const handleCreate = () => {
    setSelectedUser(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (systemUser: SystemUser) => {
    setSelectedUser(systemUser);
    setFormError(null);
    setFormOpen(true);
  };

  const handleFormSubmit = (
    data: CreateSystemUserRequest | UpdateSystemUserRequest,
  ) => {
    if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        data,
      });
      return;
    }

    createMutation.mutate(data as CreateSystemUserRequest);
  };

  const handleStatusChange = (systemUser: SystemUser) => {
    const nextStatus = !systemUser.isActive;

    if (!nextStatus) {
      const confirmed = window.confirm(
        `¿Desactivar a "${systemUser.name}"? Ya no podrá iniciar sesión, pero su historial se conservará.`,
      );

      if (!confirmed) return;
    }

    statusMutation.mutate({
      id: systemUser.id,
      isActive: nextStatus,
    });
  };

  if (usersQuery.isLoading) {
    return <Loading message="Cargando administración de usuarios..." />;
  }

  if (usersQuery.isError) {
    return <ErrorMessage message={getErrorMessage(usersQuery.error)} />;
  }

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Administración
          </Typography>
          <Typography color="text.secondary">
            Usuarios, roles, accesos y seguridad general del sistema.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ fontWeight: 800, textTransform: 'none' }}
        >
          Dar de alta usuario
        </Button>
      </Stack>

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          onClose={() => setActionError(null)}
          sx={{ mb: 2 }}
        >
          {actionError}
        </Alert>
      )}

      <Alert icon={<ShieldIcon />} severity="info" sx={{ mb: 3 }}>
        Solo los administradores pueden ver esta sección. Los permisos también
        se validan en el servidor.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 800 }}
              >
                TOTAL USUARIOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {users.length}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}>
              <PeopleIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 800 }}
              >
                ACTIVOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {totals.active}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}>
              <CheckCircleIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 800 }}
              >
                INACTIVOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {totals.inactive}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#ffebee', color: '#c62828' }}>
              <PersonOffIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 800 }}
              >
                ADMINISTRADORES
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {totals.administrators}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#fff3e0', color: '#ef6c00' }}>
              <AdminPanelSettingsIcon />
            </Avatar>
          </Stack>
        </Card>
      </Box>

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{
            mb: 2,
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', lg: 'center' },
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Usuarios del sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar nombre o correo..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={roleFilter}
                label="Rol"
                onChange={(event) =>
                  setRoleFilter(event.target.value as RoleFilter)
                }
              >
                <MenuItem value="ALL">Todos los roles</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
                <MenuItem value="VENDEDOR">Vendedor</MenuItem>
                <MenuItem value="COBRADOR">Cobrador</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="ACTIVE">Activos</MenuItem>
                <MenuItem value="INACTIVE">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'text.secondary',
                    backgroundColor: '#f7f9fb',
                    textTransform: 'uppercase',
                  },
                }}
              >
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Último acceso</TableCell>
                <TableCell>Alta</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Alert severity="info">
                      No se encontraron usuarios con esos filtros.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredUsers.map((systemUser) => {
                const isCurrentUser = currentUser?.id === systemUser.id;

                return (
                  <TableRow key={systemUser.id} hover>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: systemUser.isActive
                              ? '#e8f5e9'
                              : '#eceff1',
                            color: systemUser.isActive
                              ? '#006644'
                              : '#607d8b',
                            fontWeight: 800,
                          }}
                        >
                          {getInitials(systemUser.name)}
                        </Avatar>
                        <Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: 'center' }}
                          >
                            <Typography sx={{ fontWeight: 800 }}>
                              {systemUser.name}
                            </Typography>
                            {isCurrentUser && (
                              <Chip size="small" label="Tú" variant="outlined" />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {systemUser.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        color={getRoleColor(systemUser.role)}
                        label={roleLabels[systemUser.role]}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={systemUser.isActive ? 'success' : 'default'}
                        icon={
                          systemUser.isActive ? (
                            <CheckCircleIcon />
                          ) : (
                            <BlockIcon />
                          )
                        }
                        label={systemUser.isActive ? 'Activo' : 'Inactivo'}
                      />
                    </TableCell>

                    <TableCell>{formatDateTime(systemUser.lastLoginAt)}</TableCell>
                    <TableCell>{formatDate(systemUser.createdAt)}</TableCell>

                    <TableCell align="right">
                      <Tooltip title="Editar usuario y rol">
                        <IconButton onClick={() => handleEdit(systemUser)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Restablecer contraseña">
                        <IconButton
                          onClick={() => {
                            setFormError(null);
                            setPasswordUser(systemUser);
                          }}
                        >
                          <KeyIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        title={
                          isCurrentUser
                            ? 'No puedes desactivar tu propia cuenta'
                            : systemUser.isActive
                              ? 'Desactivar acceso'
                              : 'Activar acceso'
                        }
                      >
                        <span>
                          <IconButton
                            color={systemUser.isActive ? 'error' : 'success'}
                            disabled={
                              isCurrentUser || statusMutation.isPending
                            }
                            onClick={() => handleStatusChange(systemUser)}
                          >
                            {systemUser.isActive ? (
                              <PersonOffIcon />
                            ) : (
                              <CheckCircleIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mb: 2, alignItems: 'center' }}
        >
          <Avatar sx={{ bgcolor: '#ede7f6', color: '#5e35b1' }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Historial administrativo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Últimas acciones realizadas sobre las cuentas.
            </Typography>
          </Box>
        </Stack>

        {auditQuery.isLoading && (
          <Loading message="Cargando historial..." />
        )}

        {auditQuery.isError && (
          <Alert severity="warning">
            No se pudo cargar el historial: {getErrorMessage(auditQuery.error)}
          </Alert>
        )}

        {auditQuery.data && auditQuery.data.length === 0 && (
          <Alert severity="info">
            Todavía no existen acciones administrativas registradas.
          </Alert>
        )}

        {auditQuery.data && auditQuery.data.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Administrador</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Usuario afectado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditQuery.data.slice(0, 12).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.actor.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={<ManageAccountsIcon />}
                        label={actionLabels[log.action]}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {log.targetUser?.name ?? 'Usuario no disponible'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {formOpen && (
        <UserFormDialog
          key={selectedUser?.id ?? 'new-user'}
          open
          user={selectedUser}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError}
          onClose={() => {
            setFormOpen(false);
            setSelectedUser(null);
            setFormError(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {passwordUser && (
        <ResetPasswordDialog
          key={passwordUser.id}
          open
          user={passwordUser}
          loading={passwordMutation.isPending}
          error={formError}
          onClose={() => {
            setPasswordUser(null);
            setFormError(null);
          }}
          onSubmit={(password) =>
            passwordMutation.mutate({
              id: passwordUser.id,
              password,
            })
          }
        />
      )}
    </>
  );
}
