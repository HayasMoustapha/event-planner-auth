const express = require('express');
const authController = require('./auth.controller');
const registrationController = require('./registration.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const rbacMiddleware = require('../../middlewares/rbac.middleware');
const authValidation = require('./auth.validation');
const validate = require('../../config/validation');
const oauthRoutes = require('../oauth/oauth.routes');

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
router.post('/refresh',
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

// Alias pour mot de passe oublié (selon AUTH_FLOWS.md)
router.post('/forgot-password',
  authValidation.validateGeneratePasswordResetOtp,
  authController.generatePasswordResetOtp
);

// Réinitialiser le mot de passe avec OTP
router.post('/otp/password-reset/verify',
  authValidation.validateResetPasswordWithOtp,
  authController.resetPasswordWithOtp
);

// Alias pour réinitialisation de mot de passe (selon AUTH_FLOWS.md)
router.post('/reset-password',
  authValidation.validateResetPasswordWithOtp,
  authController.resetPasswordWithOtp
);

// Afficher le formulaire de réinitialisation (GET)
/**
 * @swagger
 * /api/auth/reset-password:
 *   get:
 *     summary: Afficher le formulaire de réinitialisation de mot de passe
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *         description: Email de l'utilisateur (optionnel mais recommandé)
 *     responses:
 *       200:
 *         description: Token valide, informations pour le formulaire
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     email:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *                     message:
 *                       type: string
 *       400:
 *         description: Token manquant, invalide ou expiré
 *       500:
 *         description: Erreur serveur
 */
router.get('/reset-password',
  authController.showResetPasswordForm
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

// Alias pour profil (selon AUTH_FLOWS.md)
router.get('/me', authController.getProfile);

// Changer le mot de passe
router.post('/change-password',
  authValidation.validateChangePassword,
  authController.changePassword
);

// Version PUT pour changement de mot de passe (selon AUTH_FLOWS.md)
router.put('/change-password',
  authValidation.validateChangePassword,
  authController.changePassword
);

/**
 * Routes d'administration - permissions spécifiques requises
 */

// Récupérer les OTP d'une personne
router.get('/otp/person/:personId',
  rbacMiddleware.requirePermission('otp.read'),
  authValidation.validatePersonIdParam,
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
  authValidation.validatePersonIdParam,
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

/**
 * Routes OAuth pour Google Sign-In et Apple Sign-In
 * Intégrées dans le module auth pour l'URL /api/auth/oauth
 */
router.use('/oauth', oauthRoutes);

module.exports = router;
