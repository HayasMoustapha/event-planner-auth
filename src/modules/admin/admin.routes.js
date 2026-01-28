/**
 * ROUTES ADMIN POUR LA GESTION RBAC
 * Endpoints pour gérer les rôles, permissions et autorisations
 */

const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { SecurityMiddleware } = require('../../../../shared');
const { body, param } = require('express-validator');

// Middleware : uniquement les super admins peuvent accéder
router.use(SecurityMiddleware.withPermissions(['admin.access', 'permissions.manage']));

/**
 * @route   POST /api/admin/rbac/seed
 * @desc    Initialise/peuple la base de données RBAC
 * @access  Private (Super Admin)
 */
router.post('/rbac/seed', adminController.seedRbac);

/**
 * @route   GET /api/admin/rbac/status
 * @desc    Vérifie le statut du peuplement RBAC
 * @access  Private (Super Admin)
 */
router.get('/rbac/status', adminController.getRbacStatus);

/**
 * @route   GET /api/admin/roles
 * @desc    Récupère tous les rôles avec leurs permissions
 * @access  Private (Super Admin)
 */
router.get('/roles', adminController.getAllRolesWithPermissions);

/**
 * @route   GET /api/admin/users/:userId/permissions
 * @desc    Récupère les permissions d'un utilisateur spécifique
 * @access  Private (Super Admin)
 */
router.get('/users/:userId/permissions', [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer')
], adminController.getUserPermissions);

/**
 * @route   POST /api/admin/users/:userId/roles
 * @desc    Assigne un rôle à un utilisateur
 * @access  Private (Super Admin)
 */
router.post('/users/:userId/roles', [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('roleId').isInt({ min: 1 }).withMessage('Role ID must be a positive integer')
], adminController.assignRole);

/**
 * @route   DELETE /api/admin/users/:userId/roles/:roleId
 * @desc    Retire un rôle d'un utilisateur
 * @access  Private (Super Admin)
 */
router.delete('/users/:userId/roles/:roleId', [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  param('roleId').isInt({ min: 1 }).withMessage('Role ID must be a positive integer')
], adminController.removeRole);

/**
 * @route   POST /api/admin/roles/:roleId/permissions
 * @desc    Ajoute une permission à un rôle
 * @access  Private (Super Admin)
 */
router.post('/roles/:roleId/permissions', [
  param('roleId').isInt({ min: 1 }).withMessage('Role ID must be a positive integer'),
  body('permissionId').isInt({ min: 1 }).withMessage('Permission ID must be a positive integer')
], adminController.addPermissionToRole);

/**
 * @route   DELETE /api/admin/roles/:roleId/permissions/:permissionId
 * @desc    Retire une permission d'un rôle
 * @access  Private (Super Admin)
 */
router.delete('/roles/:roleId/permissions/:permissionId', [
  param('roleId').isInt({ min: 1 }).withMessage('Role ID must be a positive integer'),
  param('permissionId').isInt({ min: 1 }).withMessage('Permission ID must be a positive integer')
], adminController.removePermissionFromRole);

/**
 * @route   POST /api/admin/roles
 * @desc    Crée un nouveau rôle
 * @access  Private (Super Admin)
 */
router.post('/roles', [
  body('code').trim().notEmpty().withMessage('Role code is required'),
  body('code').matches(/^[a-zA-Z0-9_-]+$/).withMessage('Role code must contain only letters, numbers, underscores and hyphens'),
  body('label').notEmpty().withMessage('Role label is required'),
  body('group').optional().trim().isAlpha().withMessage('Group must contain only letters')
], adminController.createRole);

/**
 * @route   POST /api/admin/permissions
 * @desc    Crée une nouvelle permission
 * @access  Private (Super Admin)
 */
router.post('/permissions', [
  body('code').trim().notEmpty().withMessage('Permission code is required'),
  body('code').matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Permission code must contain only letters, numbers, dots, underscores and hyphens'),
  body('label').notEmpty().withMessage('Permission label is required'),
  body('group').optional().trim().isAlpha().withMessage('Group must contain only letters')
], adminController.createPermission);

/**
 * @route   POST /api/admin/cache/refresh
 * @desc    Rafraîchit le cache des permissions
 * @access  Private (Super Admin)
 */
router.post('/cache/refresh', adminController.refreshCache);

module.exports = router;
