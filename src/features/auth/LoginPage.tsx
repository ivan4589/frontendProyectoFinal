import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

function getErrorMessage(error: unknown) {
  const anyError = error as any;

  if (anyError?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el backend. Verifica que NestJS esté corriendo en http://localhost:3000 y que CORS esté habilitado.';
  }

  const message = anyError?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (anyError?.response?.status === 401) {
    return 'Correo o contraseña incorrectos.';
  }

  if (anyError?.message) {
    return anyError.message;
  }

  return 'No se pudo iniciar sesión. Verifica tus credenciales.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setServerError(null);

      await login(
        {
          email: values.email.trim(),
          password: values.password,
        },
        values.remember,
      );

      navigate('/dashboard');
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 1fr',
        },
        backgroundColor: '#f4f7f8',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: {
            xs: 'none',
            md: 'flex',
          },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 5,
          color: '#ffffff',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(3, 61, 43, 0.98), rgba(8, 91, 64, 0.92))',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '18px 18px',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            component="img"
            src="/brand/logo-yungas.jpeg"
            alt="Yungas Distribuidora"
            sx={{
              width: 82,
              height: 82,
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              borderRadius: 1.5,
              p: 0.5,
              mb: 3,
            }}
          />

          <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
            Yungas Distribuidora
          </Typography>

          <Typography sx={{ maxWidth: 430, fontWeight: 600, opacity: 0.95 }}>
            Logística de confianza — Gestión integral para el transporte y
            distribución en tiempo real.
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <Box
            sx={{
              width: 76,
              height: 62,
              border: '7px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.14)',
            }}
          >
            <ImageOutlinedIcon sx={{ fontSize: 42 }} />
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{ position: 'relative', zIndex: 1, opacity: 0.75 }}
        >
          Sistema privado de administración comercial.
        </Typography>
      </Box>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: {
            xs: 2,
            sm: 4,
            md: 8,
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 430,
            backgroundColor: 'transparent',
          }}
        >
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
            <Box
              component="img"
              src="/brand/logo-yungas.png"
              alt="Yungas Distribuidora"
              sx={{
                width: 70,
                height: 70,
                objectFit: 'contain',
                mb: 2,
              }}
            />

            <Typography variant="h5" fontWeight={800}>
              Yungas Distribuidora
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
              Acceso al Sistema
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Ingresa tus credenciales para continuar.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.75,
              }}
            >
              <Typography
                component="label"
                htmlFor="email"
                variant="caption"
                fontWeight={800}
                sx={{ textTransform: 'uppercase' }}
              >
                Usuario o correo
              </Typography>

              <KeyboardArrowDownIcon fontSize="small" />
            </Box>

            <TextField
              id="email"
              fullWidth
              size="small"
              placeholder="admin.ops@yungas.com.bo"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Ingresa un correo válido',
                },
              })}
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.75,
              }}
            >
              <Typography
                component="label"
                htmlFor="password"
                variant="caption"
                fontWeight={800}
                sx={{ textTransform: 'uppercase' }}
              >
                Contraseña
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: '#063f2d',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ¿Olvidó su clave?
              </Typography>
            </Box>

            <TextField
              id="password"
              fullWidth
              size="small"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label="Mostrar u ocultar contraseña"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres',
                },
              })}
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={<Checkbox size="small" {...register('remember')} />}
              label={
                <Typography variant="caption">
                  Recordar esta estación por 30 días
                </Typography>
              }
              sx={{ mb: 1.5 }}
            />

            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              endIcon={<LoginIcon />}
              sx={{
                py: 1.1,
                backgroundColor: '#005b3f',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#00432f',
                },
              }}
            >
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  height: 1,
                  backgroundColor: '#e0e0e0',
                  mb: 2,
                }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Box
                  sx={{
                    height: 18,
                    borderRadius: 1,
                    backgroundColor: '#eef1f2',
                  }}
                />
                <Box
                  sx={{
                    height: 18,
                    borderRadius: 1,
                    backgroundColor: '#eef1f2',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}