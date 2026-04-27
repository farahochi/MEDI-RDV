const express = require('express');
const doctorsController = require('../controllers/doctors.controller');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, doctorsController.listDoctors);

module.exports = router;
