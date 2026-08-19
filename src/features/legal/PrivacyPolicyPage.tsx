import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Link } from 'react-router';

const sections = [
  {
    title: '1. Responsable del tratamiento',
    paragraphs: [
      'Yungas Distribuidora es responsable del tratamiento de los datos personales utilizados por su sistema privado de ventas e inventarios y por sus comunicaciones comerciales mediante WhatsApp.',
    ],
  },
  {
    title: '2. Datos que tratamos',
    paragraphs: [
      'Podemos tratar datos de identificación y contacto, como nombre, número de teléfono, correo electrónico y localidad; información relacionada con clientes, proveedores, productos, compras, ventas, pagos e inventario; y datos técnicos necesarios para proteger las cuentas y mantener el funcionamiento del sistema.',
      'Cuando se utiliza WhatsApp, también registramos el consentimiento del cliente, el número destinatario, la nota de venta enviada y el estado técnico de entrega informado por Meta. No utilizamos los mensajes para fines distintos de la atención comercial y el envío de documentos solicitados o autorizados.',
    ],
  },
  {
    title: '3. Finalidades',
    paragraphs: [
      'Usamos estos datos para administrar ventas e inventarios, emitir y enviar notas de venta en PDF, gestionar cobros, atender consultas, controlar accesos, prevenir fraudes, mantener registros de auditoría y cumplir obligaciones comerciales, contables y legales aplicables.',
    ],
  },
  {
    title: '4. Base y consentimiento para WhatsApp',
    paragraphs: [
      'Enviamos documentos por WhatsApp únicamente cuando existe una relación comercial y el cliente ha proporcionado su número y autorizado este canal. El cliente puede retirar su autorización en cualquier momento comunicándose con Yungas Distribuidora.',
    ],
  },
  {
    title: '5. Proveedores tecnológicos',
    paragraphs: [
      'Para operar el servicio podemos utilizar proveedores de infraestructura, base de datos, almacenamiento, correo y mensajería, incluidos Supabase, Render, Vercel, Resend y Meta Platforms/WhatsApp. Estos proveedores reciben únicamente los datos necesarios para prestar sus servicios y aplican sus propias condiciones y medidas de seguridad.',
      'No vendemos ni alquilamos datos personales y no los compartimos con terceros para publicidad ajena a Yungas Distribuidora.',
    ],
  },
  {
    title: '6. Conservación y seguridad',
    paragraphs: [
      'Conservamos la información durante el tiempo necesario para atender la relación comercial, proteger la integridad de los registros y cumplir obligaciones legales. Aplicamos controles de acceso por roles, autenticación, registros de auditoría, copias de seguridad y comunicaciones cifradas para reducir el riesgo de acceso no autorizado, pérdida o alteración.',
    ],
  },
  {
    title: '7. Derechos del titular',
    paragraphs: [
      'Puedes solicitar información sobre tus datos, su corrección, actualización o eliminación cuando corresponda, así como retirar el consentimiento para recibir documentos por WhatsApp. Algunas solicitudes pueden estar limitadas por obligaciones legales de conservación de documentos comerciales y contables.',
    ],
  },
  {
    title: '8. Cambios a esta política',
    paragraphs: [
      'Podemos actualizar esta política cuando cambien el servicio, los proveedores tecnológicos o las obligaciones aplicables. La versión vigente siempre estará disponible en esta dirección e indicará su fecha de actualización.',
    ],
  },
];

export function PrivacyPolicyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7f8', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ bgcolor: '#064c38', color: 'common.white', p: { xs: 3, md: 5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Box
                component="img"
                src="/brand/logo-yungas.jpeg"
                alt="Yungas Distribuidora"
                sx={{ width: 72, height: 72, objectFit: 'contain', bgcolor: 'common.white', borderRadius: 2, p: 0.5 }}
              />
              <Box>
                <Typography variant="h4" component="h1" fontWeight={900}>
                  Política de privacidad
                </Typography>
                <Typography sx={{ mt: 0.5, opacity: 0.9 }}>
                  Yungas Distribuidora · Ventas e Inventarios
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack spacing={3} sx={{ p: { xs: 3, md: 5 } }}>
            <Box>
              <Typography color="text.secondary">
                Última actualización: 19 de agosto de 2026
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Esta política explica cómo Yungas Distribuidora recopila, utiliza, protege y conserva los datos personales relacionados con sus operaciones de ventas e inventarios, incluido el envío de notas de venta mediante WhatsApp.
              </Typography>
            </Box>

            <Divider />

            {sections.map((section) => (
              <Box component="section" key={section.title}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {section.title}
                </Typography>
                <Stack spacing={1.5}>
                  {section.paragraphs.map((paragraph) => (
                    <Typography key={paragraph} color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ))}

            <Box component="section" sx={{ bgcolor: '#edf7f2', borderRadius: 2, p: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                9. Contacto
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Para consultas o solicitudes relacionadas con privacidad, comunícate con Yungas Distribuidora por WhatsApp al +591 77193574.
              </Typography>
              <Button
                component="a"
                href="https://wa.me/59177193574"
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
              >
                Contactar por WhatsApp
              </Button>
            </Box>

            <Button component={Link} to="/login" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start' }}>
              Volver al inicio de sesión
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
