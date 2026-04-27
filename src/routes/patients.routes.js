const express = require('express');
const patientsController = require('../controllers/patients.controller');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, allowRoles('doctor'), patientsController.listPatients);

module.exports = router;
