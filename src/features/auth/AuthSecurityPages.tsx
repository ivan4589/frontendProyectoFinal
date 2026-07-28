import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  confirmTwoFactor,
  forgotPasswordRequest,
  registerRequest,
  resetPasswordRequest,
  startTwoFactorSetup,
  useRecoveryCode,
  verifyEmailRequest,
  verifyTwoFactor,
} from '../../api/auth.api';
import { useAuth } from './AuthContext';

function errorMessage(error: unknown) {
  const value = error as any;
  const message = value?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || value?.message || 'No se pudo completar la operación.';
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f4f7f8', p: 2 }}>
      <Paper elevation={2} sx={{ width: '100%', maxWidth: 500, p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
        <Box component="img" src="/brand/logo-yungas.jpeg" alt="Yungas Distribuidora" sx={{ width: 68, height: 68, objectFit: 'contain', mb: 2 }} />
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>
        {children}
      </Paper>
    </Box>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', requestedRole: 'VENDEDOR', password: '', confirmPassword: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden.');
    try {
      setLoading(true); setError(null);
      const result = await registerRequest({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined,
        requestedRole: form.requestedRole as 'VENDEDOR' | 'COBRADOR', password: form.password,
      });
      setMessage(result.message);
    } catch (value) { setError(errorMessage(value)); } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Crear una cuenta" subtitle="El administrador revisará tu solicitud antes de permitir el acceso.">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nombre completo" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="Correo electrónico" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="Celular (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <TextField select label="Cargo solicitado" value={form.requestedRole} onChange={(e) => setForm({ ...form, requestedRole: e.target.value })}>
          <MenuItem value="VENDEDOR">Vendedor — todas las localidades</MenuItem>
          <MenuItem value="COBRADOR">Cobrador</MenuItem>
        </TextField>
        <TextField label="Contraseña" type="password" required helperText="Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <TextField label="Confirmar contraseña" type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Registrando...' : 'Enviar solicitud'}</Button>
        <Button component={Link} to="/login">Volver al inicio de sesión</Button>
      </Stack>
    </AuthCard>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando correo...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('error'); setMessage('El enlace no contiene un token válido.'); return; }
    verifyEmailRequest(token)
      .then((result) => { setState('success'); setMessage(result.message); })
      .catch((error) => { setState('error'); setMessage(errorMessage(error)); });
  }, [params]);

  return (
    <AuthCard title="Verificación de correo" subtitle="Confirmamos que el correo te pertenece.">
      <Alert severity={state === 'error' ? 'error' : state === 'success' ? 'success' : 'info'}>{message}</Alert>
      <Button component={Link} to="/login" fullWidth sx={{ mt: 2 }}>Ir al inicio de sesión</Button>
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try { setError(null); setMessage((await forgotPasswordRequest(email.trim())).message); }
    catch (value) { setError(errorMessage(value)); }
  };
  return (
    <AuthCard title="Recuperar contraseña" subtitle="Enviaremos un enlace de recuperación si la cuenta existe.">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Correo electrónico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" variant="contained">Enviar instrucciones</Button>
        <Button component={Link} to="/login">Volver</Button>
      </Stack>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = params.get('token');
    if (!token) return setError('El enlace de recuperación no es válido.');
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    try { setError(null); setMessage((await resetPasswordRequest(token, password)).message); }
    catch (value) { setError(errorMessage(value)); }
  };
  return (
    <AuthCard title="Nueva contraseña" subtitle="La nueva clave cerrará las sesiones abiertas anteriormente.">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nueva contraseña" type="password" required helperText="Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo." value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField label="Confirmar contraseña" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <Button type="submit" variant="contained">Cambiar contraseña</Button>
        <Button component={Link} to="/login">Volver</Button>
      </Stack>
    </AuthCard>
  );
}

export function TwoFactorPage() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const challengeToken = sessionStorage.getItem('auth_challenge') || '';
  const setupRequired = sessionStorage.getItem('auth_setup') === 'true';
  const remember = sessionStorage.getItem('auth_remember') === 'true';
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeToken) { navigate('/login', { replace: true }); return; }
    if (setupRequired) startTwoFactorSetup(challengeToken).then(setSetup).catch((e) => setError(errorMessage(e)));
  }, [challengeToken, navigate, setupRequired]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      const result = useRecovery
        ? await useRecoveryCode(challengeToken, recoveryCode)
        : setupRequired
          ? await confirmTwoFactor(challengeToken, code)
          : await verifyTwoFactor(challengeToken, code);
      completeLogin(result, remember);
      sessionStorage.removeItem('auth_challenge'); sessionStorage.removeItem('auth_setup'); sessionStorage.removeItem('auth_remember');
      if (result.recoveryCodes?.length) { setRecoveryCodes(result.recoveryCodes); return; }
      navigate('/dashboard', { replace: true });
    } catch (value) { setError(errorMessage(value)); }
  };

  if (recoveryCodes) return (
    <AuthCard title="Guarda tus códigos" subtitle="Cada código solo puede usarse una vez. Guárdalos fuera del sistema.">
      <Alert severity="warning" sx={{ mb: 2 }}>{recoveryCodes.join('  •  ')}</Alert>
      <Button fullWidth variant="contained" onClick={() => navigate('/dashboard', { replace: true })}>Continuar</Button>
    </AuthCard>
  );

  return (
    <AuthCard title={setupRequired ? 'Configurar segundo factor' : 'Verificación en dos pasos'} subtitle="Usa Google Authenticator, Microsoft Authenticator o una aplicación TOTP compatible.">
      <Stack component="form" spacing={2} onSubmit={submit}>
        {error && <Alert severity="error">{error}</Alert>}
        {setup && <Alert severity="info">Agrega esta clave en tu autenticador: <strong>{setup.secret}</strong></Alert>}
        {useRecovery ? (
          <TextField label="Código de recuperación" required value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())} />
        ) : (
          <TextField label="Código de 6 dígitos" required inputProps={{ inputMode: 'numeric', maxLength: 6 }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        )}
        <Button type="submit" variant="contained">Verificar</Button>
        {!setupRequired && <Button onClick={() => setUseRecovery((value) => !value)}>{useRecovery ? 'Usar aplicación autenticadora' : 'Usar código de recuperación'}</Button>}
      </Stack>
    </AuthCard>
  );
}
