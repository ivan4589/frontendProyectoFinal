import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import DevicesIcon from '@mui/icons-material/Devices';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import KeyIcon from '@mui/icons-material/Key';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PasswordIcon from '@mui/icons-material/Password';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router';
import {
  createSystemUser,
  getSystemUserSessions,
  getSystemUsers,
  getUserAdministrationLog,
  resetSystemUserPassword,
  resetSystemUserTwoFactor,
  revokeSystemUserSessions,
  unlockSystemUser,
  updateSystemUser,
  updateSystemUserStatus,
} from '../../api/administration.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import type {
  AdminConfirmation,
  CreateSystemUserRequest,
  ManagedUserSession,
  SystemUser,
  UpdateSystemUserRequest,
  UserAdministrationAction,
  UserSecurityStatus,
} from '../../types/administration.types';
import type { UserRole } from '../../types/auth.types';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { useAuth } from '../auth/AuthContext';
import { AdminConfirmationDialog } from './AdminConfirmationDialog';
import { TemporaryPasswordDialog } from './TemporaryPasswordDialog';
import { UserFormDialog } from './UserFormDialog';

type RoleFilter = UserRole | 'ALL';
type StatusFilter = UserSecurityStatus | 'ALL';
type UserFormDraft = Omit<CreateSystemUserRequest, 'confirmation'>;

type SensitiveAction =
  | { kind: 'create'; draft: UserFormDraft }
  | { kind: 'update'; user: SystemUser; draft: UpdateSystemUserRequest }
  | { kind: 'status'; user: SystemUser; nextActive: boolean }
  | { kind: 'password'; user: SystemUser }
  | { kind: 'unlock'; user: SystemUser }
  | { kind: 'reset2fa'; user: SystemUser }
  | { kind: 'sessions'; user: SystemUser };

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  COBRADOR: 'Cobrador',
};

const statusLabels: Record<UserSecurityStatus, string> = {
  PENDING_EMAIL_VERIFICATION: 'Correo pendiente',
  PENDING_ADMIN_APPROVAL: 'Aprobación pendiente',
  ACTIVE: 'Activo',
  REJECTED: 'Rechazado',
  TEMPORARILY_LOCKED: 'Bloqueado',
  DISABLED: 'Desactivado',
};

const actionLabels: Record<UserAdministrationAction, string> = {
  USER_CREATED: 'Creó un usuario',
  USER_UPDATED: 'Actualizó seguridad o datos',
  ROLE_CHANGED: 'Cambió el rol',
  STATUS_CHANGED: 'Cambió el estado',
  PASSWORD_RESET: 'Generó una contraseña temporal',
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
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  if (apiError.response?.status === 403) {
    return 'No tienes autorización para realizar esta operación.';
  }
  return apiError.message ?? 'Ocurrió un error inesperado.';
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function roleColor(role: UserRole) {
  if (role === 'ADMIN') return 'error' as const;
  if (role === 'COBRADOR') return 'warning' as const;
  return 'success' as const;
}

function statusColor(status: UserSecurityStatus) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'TEMPORARILY_LOCKED') return 'warning' as const;
  if (status === 'DISABLED' || status === 'REJECTED') return 'error' as const;
  return 'default' as const;
}

function manageable(user: SystemUser) {
  return ![
    'PENDING_EMAIL_VERIFICATION',
    'PENDING_ADMIN_APPROVAL',
    'REJECTED',
  ].includes(user.status);
}

function actionDescription(action: SensitiveAction) {
  switch (action.kind) {
    case 'create':
      return {
        title: 'Confirmar alta de usuario',
        description:
          'Se creará una cuenta activa y se generará una contraseña temporal de un solo uso.',
        label: 'Crear usuario',
        severity: 'warning' as const,
      };
    case 'update':
      return {
        title: 'Confirmar cambio sensible',
        description:
          'Cambiar el correo o rol cerrará todas las sesiones y tokens del usuario.',
        label: 'Guardar cambios',
        severity: 'warning' as const,
      };
    case 'status':
      return {
        title: action.nextActive ? 'Activar cuenta' : 'Desactivar cuenta',
        description: action.nextActive
          ? `Se habilitará nuevamente el acceso de ${action.user.name}.`
          : `Se cerrarán inmediatamente todas las sesiones de ${action.user.name}.`,
        label: action.nextActive ? 'Activar' : 'Desactivar',
        severity: action.nextActive ? ('warning' as const) : ('error' as const),
      };
    case 'password':
      return {
        title: 'Generar contraseña temporal',
        description:
          'La contraseña actual dejará de funcionar, las sesiones serán cerradas y el usuario deberá cambiar la nueva contraseña temporal.',
        label: 'Generar contraseña',
        severity: 'warning' as const,
      };
    case 'unlock':
      return {
        title: 'Desbloquear cuenta',
        description:
          'Se reiniciarán los intentos fallidos y el usuario podrá volver a iniciar sesión.',
        label: 'Desbloquear',
        severity: 'warning' as const,
      };
    case 'reset2fa':
      return {
        title: 'Restablecer segundo factor',
        description:
          'Se eliminará el autenticador actual, los códigos de recuperación y todas las sesiones. El usuario deberá configurar 2FA nuevamente.',
        label: 'Restablecer 2FA',
        severity: 'error' as const,
      };
    case 'sessions':
      return {
        title: 'Cerrar todas las sesiones',
        description:
          'Todos los dispositivos del usuario perderán acceso inmediatamente.',
        label: 'Cerrar sesiones',
        severity: 'error' as const,
      };
  }
}

export function AdministrationPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sensitiveAction, setSensitiveAction] =
    useState<SensitiveAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{
    value: string;
    userName: string;
  } | null>(null);
  const [sessionsUser, setSessionsUser] = useState<SystemUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ['administration', 'users'],
    queryFn: getSystemUsers,
  });
  const auditQuery = useQuery({
    queryKey: ['administration', 'audit'],
    queryFn: getUserAdministrationLog,
  });
  const sessionsQuery = useQuery({
    queryKey: ['administration', 'sessions', sessionsUser?.id],
    queryFn: () => getSystemUserSessions(sessionsUser!.id),
    enabled: Boolean(sessionsUser),
  });

  const invalidateAdministration = async () => {
    await queryClient.invalidateQueries({ queryKey: ['administration'] });
  };

  const secureMutation = useMutation({
    mutationFn: async (confirmation: AdminConfirmation) => {
      if (!sensitiveAction) throw new Error('No existe una acción pendiente');
      switch (sensitiveAction.kind) {
        case 'create':
          return {
            kind: 'password' as const,
            result: await createSystemUser({
              ...sensitiveAction.draft,
              confirmation,
            }),
          };
        case 'update': {
          const updated = await updateSystemUser(sensitiveAction.user.id, {
            ...sensitiveAction.draft,
            confirmation,
          });
          return {
            kind: 'message' as const,
            message: `Usuario ${updated.name} actualizado.`,
          };
        }
        case 'status': {
          const updated = await updateSystemUserStatus(
            sensitiveAction.user.id,
            sensitiveAction.nextActive,
            confirmation,
          );
          return {
            kind: 'message' as const,
            message: `${updated.name} quedó ${
              updated.isActive ? 'activo' : 'desactivado'
            }.`,
          };
        }
        case 'password':
          return {
            kind: 'password' as const,
            result: {
              user: sensitiveAction.user,
              ...(await resetSystemUserPassword(
                sensitiveAction.user.id,
                confirmation,
              )),
            },
          };
        case 'unlock':
          return {
            kind: 'message' as const,
            message: `${
              (await unlockSystemUser(sensitiveAction.user.id, confirmation)).name
            } fue desbloqueado.`,
          };
        case 'reset2fa':
          return {
            kind: 'message' as const,
            message: (
              await resetSystemUserTwoFactor(
                sensitiveAction.user.id,
                confirmation,
              )
            ).message,
          };
        case 'sessions':
          return {
            kind: 'message' as const,
            message: (
              await revokeSystemUserSessions(
                sensitiveAction.user.id,
                confirmation,
              )
            ).message,
          };
      }
    },
    onSuccess: async (response) => {
      const action = sensitiveAction;
      setSensitiveAction(null);
      setActionError(null);
      setFormError(null);
      setFormOpen(false);
      setSelectedUser(null);
      await invalidateAdministration();
      if (response.kind === 'password') {
        const result = response.result as {
          user?: SystemUser;
          temporaryPassword: string;
          message: string;
        };
        const userName =
          result.user?.name ??
          (action && 'user' in action ? action.user.name : 'usuario');
        setTemporaryPassword({
          value: result.temporaryPassword,
          userName,
        });
        setSuccessMessage(result.message);
      } else {
        setSuccessMessage(response.message);
      }
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const basicUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSystemUserRequest }) =>
      updateSystemUser(id, data),
    onSuccess: async (updated) => {
      setFormOpen(false);
      setSelectedUser(null);
      setFormError(null);
      setSuccessMessage(`Usuario ${updated.name} actualizado.`);
      await invalidateAdministration();
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
        systemUser.email.toLowerCase().includes(text) ||
        (systemUser.phone ?? '').toLowerCase().includes(text);
      const matchesRole =
        roleFilter === 'ALL' || systemUser.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' || systemUser.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const totals = useMemo(
    () => ({
      active: users.filter((item) => item.status === 'ACTIVE').length,
      disabled: users.filter((item) => item.status === 'DISABLED').length,
      locked: users.filter((item) => item.status === 'TEMPORARILY_LOCKED').length,
      administrators: users.filter(
        (item) => item.status === 'ACTIVE' && item.role === 'ADMIN',
      ).length,
    }),
    [users],
  );

  const submitUserForm = (
    data: UserFormDraft | UpdateSystemUserRequest,
  ) => {
    if (!selectedUser) {
      setFormOpen(false);
      setSensitiveAction({ kind: 'create', draft: data as UserFormDraft });
      return;
    }

    const draft = data as UpdateSystemUserRequest;
    const roleChanged = draft.role !== selectedUser.role;
    const emailChanged = draft.email !== selectedUser.email;
    if (selectedUser.id === currentUser?.id && roleChanged) {
      setFormError('No puedes cambiar tu propio rol de administrador.');
      return;
    }
    if (roleChanged || emailChanged) {
      setFormOpen(false);
      setSensitiveAction({ kind: 'update', user: selectedUser, draft });
      return;
    }
    basicUpdateMutation.mutate({ id: selectedUser.id, data: draft });
  };

  if (usersQuery.isLoading) {
    return <Loading message="Cargando administración segura de usuarios..." />;
  }
  if (usersQuery.isError) {
    return <ErrorMessage message={getErrorMessage(usersQuery.error)} />;
  }

  const confirmationInfo = sensitiveAction
    ? actionDescription(sensitiveAction)
    : null;

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Administración segura de usuarios
          </Typography>
          <Typography color="text.secondary">
            Controla cuentas, roles, sesiones, bloqueos y segundo factor.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            to="/administration/registration-requests"
            variant="outlined"
            startIcon={<ManageAccountsIcon />}
          >
            Solicitudes de acceso
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedUser(null);
              setFormError(null);
              setFormOpen(true);
            }}
          >
            Dar de alta usuario
          </Button>
        </Stack>
      </Stack>

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {actionError && !sensitiveAction && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      <Alert icon={<ShieldIcon />} severity="info" sx={{ mb: 3 }}>
        Las acciones críticas requieren tu contraseña, código TOTP y un motivo.
        El servidor revoca las sesiones cuando cambia el acceso de una cuenta.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          ['TOTAL', users.length, <ManageAccountsIcon />],
          ['ACTIVOS', totals.active, <CheckCircleIcon />],
          ['DESACTIVADOS', totals.disabled, <PersonOffIcon />],
          ['BLOQUEADOS', totals.locked, <BlockIcon />],
          ['ADMINISTRADORES', totals.administrators, <AdminPanelSettingsIcon />],
        ].map(([label, value, icon]) => (
          <Card key={String(label)} sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  {label}
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {String(value)}
                </Typography>
              </Box>
              <Avatar>{icon}</Avatar>
            </Stack>
          </Card>
        ))}
      </Box>

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ mb: 2, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Usuarios del sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredUsers.length} de {users.length}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar nombre, correo o teléfono..."
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
            <FormControl size="small" sx={{ minWidth: 145 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={roleFilter}
                label="Rol"
                onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              >
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
                <MenuItem value="VENDEDOR">Vendedor</MenuItem>
                <MenuItem value="COBRADOR">Cobrador</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 175 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <MenuItem value="ALL">Todos</MenuItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Seguridad</TableCell>
                <TableCell>Último acceso</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((systemUser) => {
                const isSelf = systemUser.id === currentUser?.id;
                return (
                  <TableRow key={systemUser.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar>{initials(systemUser.name)}</Avatar>
                        <Box>
                          <Typography fontWeight={700}>
                            {systemUser.name}
                            {isSelf && (
                              <Chip label="Tú" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {systemUser.email}
                          </Typography>
                          {systemUser.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {systemUser.phone}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={roleLabels[systemUser.role]}
                        size="small"
                        color={roleColor(systemUser.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[systemUser.status]}
                        size="small"
                        color={statusColor(systemUser.status)}
                      />
                      {systemUser.lockedUntil && (
                        <Typography variant="caption" display="block">
                          Hasta {formatDateTime(systemUser.lockedUntil)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={systemUser.twoFactorEnabled ? 'success' : 'warning'}
                          label={systemUser.twoFactorEnabled ? '2FA activo' : '2FA pendiente'}
                        />
                        {systemUser.mustChangePassword && (
                          <Chip
                            size="small"
                            color="warning"
                            label="Debe cambiar contraseña"
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {systemUser.activeSessions} sesiones activas
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {systemUser.lastLoginAt
                        ? formatDateTime(systemUser.lastLoginAt)
                        : 'Nunca'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        <Tooltip title="Editar datos y rol">
                          <span>
                            <IconButton
                              size="small"
                              disabled={!manageable(systemUser)}
                              onClick={() => {
                                setSelectedUser(systemUser);
                                setFormError(null);
                                setFormOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Ver sesiones">
                          <IconButton
                            size="small"
                            onClick={() => setSessionsUser(systemUser)}
                          >
                            <DevicesIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {systemUser.status === 'TEMPORARILY_LOCKED' && (
                          <Tooltip title="Desbloquear cuenta">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() =>
                                setSensitiveAction({ kind: 'unlock', user: systemUser })
                              }
                            >
                              <LockOpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {manageable(systemUser) && !isSelf && (
                          <Tooltip title="Generar contraseña temporal">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setSensitiveAction({ kind: 'password', user: systemUser })
                              }
                            >
                              <PasswordIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {systemUser.twoFactorEnabled && !isSelf && (
                          <Tooltip title="Restablecer segundo factor">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() =>
                                setSensitiveAction({ kind: 'reset2fa', user: systemUser })
                              }
                            >
                              <KeyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {systemUser.activeSessions > 0 && !isSelf && (
                          <Tooltip title="Cerrar todas las sesiones">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setSensitiveAction({ kind: 'sessions', user: systemUser })
                              }
                            >
                              <DevicesIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {manageable(systemUser) && !isSelf && (
                          <Tooltip
                            title={systemUser.isActive ? 'Desactivar' : 'Activar'}
                          >
                            <IconButton
                              size="small"
                              color={systemUser.isActive ? 'error' : 'success'}
                              onClick={() =>
                                setSensitiveAction({
                                  kind: 'status',
                                  user: systemUser,
                                  nextActive: !systemUser.isActive,
                                })
                              }
                            >
                              {systemUser.isActive ? (
                                <BlockIcon fontSize="small" />
                              ) : (
                                <CheckCircleIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <HistoryIcon />
          <Typography variant="h6" fontWeight={800}>
            Auditoría administrativa reciente
          </Typography>
        </Stack>
        {auditQuery.isError && (
          <Alert severity="error">{getErrorMessage(auditQuery.error)}</Alert>
        )}
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Administrador</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Usuario afectado</TableCell>
                <TableCell>Motivo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(auditQuery.data ?? []).slice(0, 100).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>{entry.actor.name}</TableCell>
                  <TableCell>{actionLabels[entry.action]}</TableCell>
                  <TableCell>{entry.targetUser?.name ?? 'Sin usuario'}</TableCell>
                  <TableCell>
                    {typeof entry.details?.reason === 'string'
                      ? entry.details.reason
                      : typeof entry.details?.operation === 'string'
                        ? entry.details.operation
                        : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary">
          Las acciones se conservan para trazabilidad. Fecha de referencia:{' '}
          {formatDate(new Date().toISOString())}.
        </Typography>
      </Paper>

      <UserFormDialog
        open={formOpen}
        user={selectedUser}
        loading={basicUpdateMutation.isPending}
        error={formError}
        onClose={() => {
          setFormOpen(false);
          setSelectedUser(null);
          setFormError(null);
        }}
        onSubmit={submitUserForm}
      />

      {confirmationInfo && (
        <AdminConfirmationDialog
          open={Boolean(sensitiveAction)}
          title={confirmationInfo.title}
          description={confirmationInfo.description}
          confirmLabel={confirmationInfo.label}
          severity={confirmationInfo.severity}
          loading={secureMutation.isPending}
          error={actionError}
          onClose={() => {
            setSensitiveAction(null);
            setActionError(null);
          }}
          onConfirm={(confirmation) => secureMutation.mutate(confirmation)}
        />
      )}

      <TemporaryPasswordDialog
        open={Boolean(temporaryPassword)}
        password={temporaryPassword?.value ?? ''}
        userName={temporaryPassword?.userName}
        onClose={() => setTemporaryPassword(null)}
      />

      <Dialog
        open={Boolean(sessionsUser)}
        onClose={() => setSessionsUser(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Sesiones activas de {sessionsUser?.name ?? 'usuario'}
        </DialogTitle>
        <DialogContent dividers>
          {sessionsQuery.isLoading ? (
            <Loading message="Cargando sesiones..." />
          ) : sessionsQuery.isError ? (
            <Alert severity="error">{getErrorMessage(sessionsQuery.error)}</Alert>
          ) : (sessionsQuery.data ?? []).length === 0 ? (
            <Alert severity="info">No existen sesiones activas.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {(sessionsQuery.data as ManagedUserSession[]).map((session) => (
                <Paper key={session.id} variant="outlined" sx={{ p: 2 }}>
                  <Typography fontWeight={700}>
                    {session.deviceName || 'Dispositivo no identificado'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IP: {session.ipAddress || 'No disponible'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Última actividad: {formatDateTime(session.lastActivityAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expira: {formatDateTime(session.expiresAt)}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionsUser(null)}>Cerrar</Button>
          {sessionsUser &&
            sessionsUser.activeSessions > 0 &&
            sessionsUser.id !== currentUser?.id && (
              <Button
                color="error"
                startIcon={<DevicesIcon />}
                onClick={() => {
                  const user = sessionsUser;
                  setSessionsUser(null);
                  setSensitiveAction({ kind: 'sessions', user });
                }}
              >
                Cerrar todas las sesiones
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </>
  );
}
