const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const patientsRoutes = require('./routes/patients.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const publicRoutes = require('./routes/public.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MediRDV API'
  });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route introuvable.'
  });
});

app.use(errorHandler);

module.exports = app;
