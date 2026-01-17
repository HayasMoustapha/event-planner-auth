const express = require('express');
const { body, param, query } = require('express-validator');
const sessionMonitoringController = require('./session-monitoring.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/rbac.middleware');

const router = express.Router();

/**
 * Routes pour le monitoring des sessions
 * Toutes nécessitent une authentification et des permissions spécifiques
 */

// Middleware de validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être un entier entre 1 et 100')
];

const validateUserId = [
  param('userId').isInt({ min: 1 }).withMessage('L\'ID utilisateur doit être un entier positif')
];

const validateSessionCleanup = [
  body('olderThan').optional().isInt({ min: 1, max: 365 }).withMessage('L\'ancienneté doit être entre 1 et 365 jours')
];

const validateRevokeSessions = [
  body('reason').optional().isLength({ min: 1, max: 255 }).withMessage('La raison doit contenir entre 1 et 255 caractères'),
  body('revokedBy').optional().isInt({ min: 1 }).withMessage('L\'ID du révocateur doit être un entier positif')
];

const validateSessionLimits = [
  query('maxActiveSessions').optional().isInt({ min: 1, max: 50 }).withMessage('Le max de sessions actives doit être entre 1 et 50'),
  query('maxTotalSessions').optional().isInt({ min: 1, max: 100 }).withMessage('Le max total de sessions doit être entre 1 et 100')
];

const validateSuspiciousSessions = [
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Le nombre d\'heures doit être entre 1 et 168'),
  query('maxSessionsPerUser').optional().isInt({ min: 1, max: 100 }).withMessage('Le max de sessions par utilisateur doit être entre 1 et 100')
];

/**
 * @route GET /api/sessions/stats
 * @desc Récupère les statistiques générales des sessions
 * @access Admin, Manager
 */
router.get('/stats', 
  authenticate, 
  authorize('sessions.read'), 
  sessionMonitoringController.getSessionStats
);

/**
 * @route GET /api/sessions/active
 * @desc Récupère les sessions actives avec pagination
 * @access Admin, Manager
 */
router.get('/active', 
  authenticate, 
  authorize('sessions.read'), 
  validatePagination,
  sessionMonitoringController.getActiveSessions
);

/**
 * @route GET /api/sessions/user/:userId
 * @desc Récupère les sessions d'un utilisateur spécifique
 * @access Admin, Manager, ou l'utilisateur lui-même
 */
router.get('/user/:userId', 
  authenticate, 
  authorize('sessions.read'), 
  validateUserId,
  validatePagination,
  sessionMonitoringController.getUserSessions
);

/**
 * @route GET /api/sessions/blacklisted
 * @desc Récupère les tokens blacklistés
 * @access Admin, Manager
 */
router.get('/blacklisted', 
  authenticate, 
  authorize('sessions.read'), 
  validatePagination,
  sessionMonitoringController.getBlacklistedTokens
);

/**
 * @route POST /api/sessions/revoke-all/:userId
 * @desc Révoque toutes les sessions d'un utilisateur
 * @access Admin uniquement
 */
router.post('/revoke-all/:userId', 
  authenticate, 
  authorize('sessions.revoke'), 
  validateUserId,
  validateRevokeSessions,
  sessionMonitoringController.revokeAllUserSessions
);

/**
 * @route POST /api/sessions/cleanup
 * @desc Nettoie les sessions expirées
 * @access Admin uniquement
 */
router.post('/cleanup', 
  authenticate, 
  authorize('sessions.cleanup'), 
  validateSessionCleanup,
  sessionMonitoringController.cleanupExpiredSessions
);

/**
 * @route GET /api/sessions/limits/:userId
 * @desc Vérifie les limites de sessions d'un utilisateur
 * @access Admin, Manager, ou l'utilisateur lui-même
 */
router.get('/limits/:userId', 
  authenticate, 
  authorize('sessions.read'), 
  validateUserId,
  validateSessionLimits,
  sessionMonitoringController.checkSessionLimits
);

/**
 * @route GET /api/sessions/suspicious
 * @desc Récupère les sessions suspectes
 * @access Admin, Security Manager
 */
router.get('/suspicious', 
  authenticate, 
  authorize('sessions.monitor'), 
  validateSuspiciousSessions,
  sessionMonitoringController.getSuspiciousSessions
);

module.exports = router;
