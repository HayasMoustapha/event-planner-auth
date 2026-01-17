const express = require('express');
const authController = require('./auth.controller');
const registrationController = require('./registration.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const authValidation = require('./auth.validation');
const validate = require('../../config/validation');

const router = express.Router();

/**
 * Routes publiques d'authentification
 * Ces routes ne nécessitent pas d'authentification préalable
 */

// Connexion classique avec email et mot de passe
router.post('/login', 
  authValidation.validateLogin,
  authController.login
);

// Connexion avec remember token
router.post('/login-remember', 
  authValidation.validateLogin,
  authController.loginWithRememberToken
);

// Connexion avec OTP
router.post('/login-otp', 
  authValidation.validateLoginWithOtp,
  authController.loginWithOtp
);

// Rafraîchissement de token
router.post('/refresh-token', 
  authValidation.validateRefreshToken,
  authController.refreshToken
);

// Validation de token
router.post('/validate-token', 
  authValidation.validateToken,
  authController.validateToken
);

/**
 * Routes de gestion des OTP
 * Ces routes peuvent être publiques pour la génération d'OTP
 */

// Générer OTP pour email
router.post('/otp/email/generate', 
  authValidation.validateGenerateEmailOtp,
  authController.generateEmailOtp
);

// Générer OTP pour téléphone
router.post('/otp/phone/generate', 
  authValidation.validateGeneratePhoneOtp,
  authController.generatePhoneOtp
);

// Vérifier OTP pour email
router.post('/otp/email/verify', 
  authValidation.validateVerifyEmailOtp,
  authController.verifyEmailOtp
);

// Vérifier OTP pour téléphone
router.post('/otp/phone/verify', 
  authValidation.validateVerifyPhoneOtp,
  authController.verifyPhoneOtp
);

// Générer OTP pour réinitialisation de mot de passe
router.post('/otp/password-reset/generate', 
  authValidation.validateGeneratePasswordResetOtp,
  authController.generatePasswordResetOtp
);

// Réinitialiser le mot de passe avec OTP
router.post('/otp/password-reset/verify', 
  authValidation.validateResetPasswordWithOtp,
  authController.resetPasswordWithOtp
);

/**
 * Routes d'inscription (publiques)
 */

// Inscription d'un nouvel utilisateur
router.post('/register', 
  authValidation.validateRegister,
  registrationController.register
);

// Vérification d'email avec OTP
router.post('/verify-email', 
  authValidation.validateVerifyEmail,
  registrationController.verifyEmail
);

// Renvoi d'OTP
router.post('/resend-otp', 
  authValidation.validateResendOtp,
  registrationController.resendOTP
);

// Connexion après vérification
router.post('/login-after-verification', 
  authValidation.validateLogin,
  registrationController.loginAfterVerification
);

// Vérification disponibilité email
router.get('/check-email/:email', 
  authValidation.validateEmailParam,
  registrationController.checkEmailAvailability
);

// Vérification disponibilité username
router.get('/check-username/:username', 
  authValidation.validateUsernameParam,
  registrationController.checkUsernameAvailability
);

/**
 * Routes protégées - authentification requise
 */
router.use(authMiddleware.authenticate);

// Déconnexion
router.post('/logout', authController.logout);

// Récupérer le profil utilisateur
router.get('/profile', authController.getProfile);

// Changer le mot de passe
router.post('/change-password', 
  authValidation.validateChangePassword,
  authController.changePassword
);

/**
 * Routes d'administration - permissions spécifiques requises
 */

// Récupérer les OTP d'une personne
router.get('/otp/person/:personId', 
  rbacMiddleware.requirePermission('otp.read'),
  authController.getUserOtps
);

// Invalider les OTP d'une personne
router.post('/otp/person/:personId/invalidate', 
  rbacMiddleware.requirePermission('otp.manage'),
  authValidation.validateInvalidateUserOtps,
  authController.invalidateUserOtps
);

// Vérifier si une personne a des OTP actifs
router.get('/otp/person/:personId/active', 
  rbacMiddleware.requirePermission('otp.read'),
  authController.hasActiveOtp
);

// Nettoyer les OTP expirés (maintenance)
router.post('/otp/cleanup', 
  rbacMiddleware.requirePermission('otp.manage'),
  authController.cleanupExpiredOtps
);

// Statistiques sur les OTP
router.get('/otp/stats', 
  rbacMiddleware.requirePermission('otp.stats'),
  authController.getOtpStats
);

module.exports = router;
