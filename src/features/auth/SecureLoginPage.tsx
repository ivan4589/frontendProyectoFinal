import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';

function getErrorMessage(error: unknown) {
  const value = error as any;
  const message = value?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || value?.message || 'No se pudo iniciar sesión.';
}

export function SecureLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError(null);
      const response = await login({ email: email.trim(), password }, remember);
      if (response.requiresTwoFactor || response.requiresTwoFactorSetup) {
        if (!response.challengeToken) throw new Error('El servidor no devolvió el desafío de seguridad.');
        sessionStorage.setItem('auth_challenge', response.challengeToken);
        sessionStorage.setItem('auth_setup', String(Boolean(response.requiresTwoFactorSetup)));
        sessionStorage.setItem('auth_remember', String(remember));
        navigate('/segundo-factor');
        return;
      }
      navigate('/dashboard');
    } catch (value) { setError(getErrorMessage(value)); } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, bgcolor: '#f4f7f8' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 7, color: 'white', background: 'linear-gradient(135deg, #033d2b, #085b40)' }}>
        <Box component="img" src="/brand/logo-yungas.jpeg" alt="Yungas Distribuidora" sx={{ width: 86, height: 86, objectFit: 'contain', bgcolor: 'white', borderRadius: 2, p: 0.5, mb: 3 }} />
        <Typography variant="h3" fontWeight={900}>Yungas Distribuidora</Typography>
        <Typography sx={{ mt: 2, maxWidth: 480, opacity: 0.9 }}>Sistema privado de ventas e inventarios protegido con aprobación administrativa y autenticación en dos pasos.</Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: 2 }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 430, p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={800}>Acceso al sistema</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Ingresa tu correo y contraseña para continuar.</Typography>
          <Stack component="form" spacing={2} onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Correo electrónico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon /></InputAdornment> }} />
            <TextField label="Contraseña" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((value) => !value)}>{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment> }} />
            <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Recordar esta sesión" />
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Verificando...' : 'Ingresar'}</Button>
            <Button component={Link} to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Button>
            <Button component={Link} to="/registro" variant="outlined">Solicitar una cuenta</Button>
            <Button component={Link} to="/politica-de-privacidad" color="inherit" size="small">
              Política de privacidad
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
