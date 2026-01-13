const express = require('express');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

// Routes publiques
router.post('/register', authValidation.register, authController.register);
router.post('/login', authValidation.login, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authValidation.forgotPassword, authController.forgotPassword);
router.post('/reset-password', authValidation.resetPassword, authController.resetPassword);
router.post('/verify-email', authValidation.verifyEmail, authController.verifyEmail);
router.post('/resend-verification', authValidation.resendVerification, authController.resendVerification);

// Routes protégées
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.get('/me', authMiddleware.authenticate, authController.getProfile);
router.put('/me', authMiddleware.authenticate, authValidation.updateProfile, authController.updateProfile);
router.put('/change-password', authMiddleware.authenticate, authValidation.changePassword, authController.changePassword);

module.exports = router;
