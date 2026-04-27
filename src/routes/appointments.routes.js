const express = require('express');
const appointmentsController = require('../controllers/appointments.controller');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, appointmentsController.listAppointments);
router.post('/', authRequired, allowRoles('patient'), appointmentsController.createAppointment);
router.patch('/:id', authRequired, appointmentsController.updateAppointment);
router.patch('/:id/status', authRequired, allowRoles('doctor'), appointmentsController.updateAppointmentStatus);
router.delete('/:id', authRequired, allowRoles('patient'), appointmentsController.cancelAppointment);

module.exports = router;
