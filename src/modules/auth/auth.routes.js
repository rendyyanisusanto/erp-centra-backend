const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authenticate = require('../../middlewares/auth');

router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
