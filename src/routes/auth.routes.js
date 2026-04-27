const express = require('express');
const authController = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/register/:role', authController.register);
router.post('/login', authController.login);
router.get('/me', authRequired, authController.me);
router.post('/reset-password', authRequired, authController.resetPassword);

module.exports = router;
