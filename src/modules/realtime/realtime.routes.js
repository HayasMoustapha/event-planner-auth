/**
 * ROUTES POUR LES ENDPOINTS TEMPS RÉEL
 * Gestion du rafraîchissement des permissions et menus en temps réel
 */

const express = require('express');
const router = express.Router();
const realtimeController = require('./realtime.controller');
const { SecurityMiddleware } = require('../../../../shared');
const { body, param, query } = require('express-validator');

// Middleware : tous les utilisateurs authentifiés peuvent accéder
router.use(SecurityMiddleware.authenticated());

/**
 * @route   GET /api/realtime/menu
 * @desc    Récupère le menu de l'utilisateur connecté
 * @access  Private
 */
router.get('/menu', [
  query('language').optional().isIn(['en', 'fr']).withMessage('Language must be en or fr')
], realtimeController.getUserMenu);

/**
 * @route   GET /api/realtime/permissions/sse
 * @desc    Endpoint Server-Sent Events pour le rafraîchissement des permissions
 * @access  Private
 */
router.get('/permissions/sse', realtimeController.permissionsSSE);

/**
 * @route   POST /api/realtime/users/:userId/refresh
 * @desc    Force le rafraîchissement des permissions d'un utilisateur
 * @access  Private (Admin)
 */
router.post('/users/:userId/refresh', [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('permissions').optional().isBoolean().withMessage('Permissions must be boolean'),
  body('menu').optional().isBoolean().withMessage('Menu must be boolean')
], SecurityMiddleware.withPermissions(['admin.access']), realtimeController.refreshUserPermissions);

/**
 * @route   POST /api/realtime/broadcast
 * @desc    Envoie une notification à tous les utilisateurs connectés
 * @access  Private (Admin)
 */
router.post('/broadcast', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error']).withMessage('Type must be info, success, warning, or error')
], SecurityMiddleware.withPermissions(['admin.access']), realtimeController.broadcastNotification);

/**
 * @route   GET /api/realtime/stats
 * @desc    Statistiques du service temps réel
 * @access  Private (Admin)
 */
router.get('/stats', SecurityMiddleware.withPermissions(['admin.access']), realtimeController.getRealtimeStats);

/**
 * @route   POST /api/realtime/menus
 * @desc    Crée un menu personnalisé
 * @access  Private (Admin)
 */
router.post('/menus', [
  body('code').trim().notEmpty().withMessage('Menu code is required'),
  body('code').matches(/^[a-zA-Z0-9_-]+$/).withMessage('Menu code must contain only letters, numbers, underscores and hyphens'),
  body('label').notEmpty().withMessage('Menu label is required'),
  body('route').optional().isString().withMessage('Route must be a string'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], SecurityMiddleware.withPermissions(['admin.access']), realtimeController.createCustomMenu);

/**
 * @route   POST /api/realtime/users/:userId/menus
 * @desc    Assigne un menu personnalisé à un utilisateur
 * @access  Private (Admin)
 */
router.post('/users/:userId/menus', [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('menuId').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer')
], SecurityMiddleware.withPermissions(['admin.access']), realtimeController.assignCustomMenu);

/**
 * @route   POST /api/realtime/test
 * @desc    Test du système temps réel
 * @access  Private (Admin)
 */
router.post('/test', [
  body('message').optional().isString().withMessage('Message must be a string'),
  body('userId').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer')
], SecurityMiddleware.withPermissions(['admin.access']), realtimeController.testRealtime);

module.exports = router;
