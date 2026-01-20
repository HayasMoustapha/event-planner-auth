const express = require('express');
const router = express.Router();
const passwordController = require('./password.controller');
const passwordValidation = require('./password.validation');
const { authenticate } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /api/password/reset-request:
 *   post:
 *     summary: Demander une réinitialisation de mot de passe
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *     responses:
 *       200:
 *         description: Demande de réinitialisation envoyée
 *       400:
 *         description: Erreur de validation
 */
router.post('/reset-request', 
  passwordValidation.validatePasswordResetRequest,
  passwordController.requestPasswordReset
);

/**
 * @swagger
 * /api/password/reset:
 *   post:
 *     summary: Réinitialiser un mot de passe avec un token
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *               token:
 *                 type: string
 *                 description: Token de réinitialisation
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Erreur de validation ou token invalide
 */
router.post('/reset', 
  passwordValidation.validatePasswordReset,
  passwordController.resetPassword
);

/**
 * @swagger
 * /api/password/history:
 *   get:
 *     summary: Récupérer l'historique des mots de passe
 *     tags: [Password]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *       401:
 *         description: Non authentifié
 */
router.get('/history', 
  authenticate,
  passwordValidation.validatePasswordHistory,
  passwordController.getPasswordHistory
);

module.exports = router;
