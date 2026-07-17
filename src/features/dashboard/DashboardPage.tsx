import { Grid, Paper, Typography } from '@mui/material';

const cards = [
  {
    title: 'Ventas de hoy',
    value: '0 Bs.',
  },
  {
    title: 'Ventas del mes',
    value: '0 Bs.',
  },
  {
    title: 'Cuentas por cobrar',
    value: '0 Bs.',
  },
  {
    title: 'Stock bajo',
    value: '0',
  },
];

export function DashboardPage() {
  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Paper sx={{ p: 3 }}>
              <Typography color="text.secondary" gutterBottom>
                {card.title}
              </Typography>

              <Typography variant="h4">{card.value}</Typography>
            </Paper>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Base del frontend lista
            </Typography>

            <Typography color="text.secondary">
              En el siguiente módulo conectaremos el login real con el backend.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}