import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyIcon from '@mui/icons-material/Key';
import PasswordIcon from '@mui/icons-material/Password';
import { useNavigate } from 'react-router-dom';
import {
  changePassword,
  getSessions,
  logoutAllSessions,
  regenerateRecoveryCodes,
  revokeSession,
} from '../../api/auth.api';
import type { AuthSession } from '../../types/auth.types';
import { useAuth } from './AuthContext';

function errorMessage(error: unknown) {
  const value = error as any;
  const message = value?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || value?.message || 'No se pudo completar la operación.';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [recoveryForm, setRecoveryForm] = useState({
    password: '',
    code: '',
  });
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      setSessions(await getSessions());
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const closeSession = async (session: AuthSession) => {
    try {
      setError(null);
      const result = await revokeSession(session.id);
      if (result.currentSessionRevoked) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }
      setMessage(result.message);
      await loadSessions();
    } catch (value) {
      setError(errorMessage(value));
    }
  };

  const closeAll = async () => {
    if (!window.confirm('¿Cerrar todas las sesiones, incluida esta computadora?')) {
      return;
    }
    try {
      await logoutAllSessions();
      await logout();
      navigate('/login', { replace: true });
    } catch (value) {
      setError(errorMessage(value));
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    try {
      setError(null);
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      await logout();
      navigate('/login', { replace: true });
    } catch (value) {
      setError(errorMessage(value));
    }
  };

  const submitRecoveryCodes = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      const result = await regenerateRecoveryCodes(
        recoveryForm.password,
        recoveryForm.code,
      );
      setRecoveryCodes(result.recoveryCodes);
      setRecoveryForm({ password: '', code: '' });
      setMessage('Se generaron nuevos códigos. Los anteriores dejaron de funcionar.');
    } catch (value) {
      setError(errorMessage(value));
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Seguridad de la cuenta
        </Typography>
        <Typography color="text.secondary">
          Administra tu contraseña, sesiones y códigos de recuperación.
        </Typography>
      </Box>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DevicesIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Sesiones activas
              </Typography>
            </Stack>
            <Typography color="text.secondary">
              Cierra cualquier sesión que no reconozcas.
            </Typography>
            <Divider />
            {loadingSessions ? (
              <Typography>Cargando sesiones...</Typography>
            ) : sessions.length === 0 ? (
              <Typography>No hay sesiones activas.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {sessions.map((session) => (
                  <Box
                    key={session.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      flexDirection: { xs: 'column', md: 'row' },
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 700 }}>
                          {session.deviceName}
                        </Typography>
                        {session.current && <Chip size="small" label="Sesión actual" color="success" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        IP: {session.ipAddress || 'No disponible'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Última actividad: {formatDate(session.lastActivityAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expira: {formatDate(session.expiresAt)}
                      </Typography>
                    </Box>
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => closeSession(session)}
                    >
                      Cerrar sesión
                    </Button>
                  </Box>
                ))}
              </Stack>
            )}
            <Button color="error" onClick={closeAll}>
              Cerrar todas las sesiones
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submitPassword}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PasswordIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Cambiar contraseña
              </Typography>
            </Stack>
            <Alert severity="info">
              Al cambiarla se cerrarán todas las sesiones y tendrás que iniciar sesión nuevamente.
            </Alert>
            <TextField
              label="Contraseña actual"
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: event.target.value,
                })
              }
            />
            <TextField
              label="Nueva contraseña"
              type="password"
              required
              helperText="Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo."
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: event.target.value,
                })
              }
            />
            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: event.target.value,
                })
              }
            />
            <Button type="submit" variant="contained">
              Cambiar contraseña
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submitRecoveryCodes}>
            <Stack direction="row" spacing={1} alignItems="center">
              <KeyIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Códigos de recuperación
              </Typography>
            </Stack>
            <Typography color="text.secondary">
              Para generar códigos nuevos debes confirmar tu contraseña y un código de tu autenticador.
            </Typography>
            <TextField
              label="Contraseña"
              type="password"
              required
              value={recoveryForm.password}
              onChange={(event) =>
                setRecoveryForm({
                  ...recoveryForm,
                  password: event.target.value,
                })
              }
            />
            <TextField
              label="Código de 6 dígitos"
              required
              value={recoveryForm.code}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
              onChange={(event) =>
                setRecoveryForm({
                  ...recoveryForm,
                  code: event.target.value.replace(/\D/g, ''),
                })
              }
            />
            <Button type="submit" variant="outlined">
              Regenerar códigos
            </Button>
            {recoveryCodes && (
              <Alert severity="warning">
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 700 }}>
                    Guarda estos códigos ahora. No volverán a mostrarse.
                  </Typography>
                  {recoveryCodes.map((item) => (
                    <Typography key={item} component="code">
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
