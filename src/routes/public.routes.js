const express = require('express');
const doctorsController = require('../controllers/doctors.controller');

const router = express.Router();

router.get('/doctors', doctorsController.listDoctors);

module.exports = router;
