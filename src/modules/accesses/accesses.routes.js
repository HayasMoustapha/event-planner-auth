const express = require('express');
const router = express.Router();
const accessesController = require('./accesses.controller');
const accessesValidation = require('./accesses.validation');
const { asyncAccessesErrorHandler } = require('./accesses.errorHandler');
const rbacMiddleware = require('../../middleware/rbac.middleware');

// Middleware de gestion d'erreurs pour toutes les routes
router.use(asyncAccessesErrorHandler);

/**
 * @swagger
 * /api/accesses:
 *   get:
 *     summary: Récupérer toutes les associations utilisateur-rôle
 *     tags: [Accesses]
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
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 255
 *         description: Terme de recherche (username, email, code rôle)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, lock]
 *         description: Filtrer par statut
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtrer par ID d'utilisateur
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtrer par ID de rôle
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, status, user_id, role_id]
 *           default: created_at
 *         description: Champ de tri
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Ordre de tri
 *     responses:
 *       200:
 *         description: Liste des accès récupérée avec succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get('/', 
  rbacMiddleware.requirePermission('accesses.read'),
  accessesValidation.validateGetAccesses,
  accessesController.getAllAccesses
);

/**
 * @swagger
 * /api/accesses/{id}:
 *   get:
 *     summary: Récupérer un accès par son ID
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'accès
 *     responses:
 *       200:
 *         description: Accès récupéré avec succès
 *       404:
 *         description: Accès non trouvé
 *       400:
 *         description: ID invalide
 */
router.get('/:id', 
  rbacMiddleware.requirePermission('accesses.read'),
  accessesValidation.validateAccessId,
  accessesController.getAccessById
);

/**
 * @swagger
 * /api/accesses:
 *   post:
 *     summary: Créer une nouvelle association utilisateur-rôle
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID de l'utilisateur
 *               roleId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID du rôle
 *               status:
 *                 type: string
 *                 enum: [active, inactive, lock]
 *                 default: active
 *                 description: Statut de l'accès
 *     responses:
 *       201:
 *         description: Accès créé avec succès
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: L'utilisateur a déjà ce rôle
 */
router.post('/', 
  rbacMiddleware.requirePermission('accesses.create'),
  accessesValidation.validateCreateAccess,
  accessesController.createAccess
);

/**
 * @swagger
 * /api/accesses/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'un accès
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'accès
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, lock]
 *                 description: Nouveau statut de l'accès
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       404:
 *         description: Accès non trouvé
 */
router.put('/:id/status', 
  rbacMiddleware.requirePermission('accesses.update'),
  accessesValidation.validateUpdateAccessStatus,
  accessesController.updateAccessStatus
);

/**
 * @swagger
 * /api/accesses/{id}:
 *   delete:
 *     summary: Supprimer un accès (soft delete)
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'accès
 *     responses:
 *       200:
 *         description: Accès supprimé avec succès
 *       404:
 *         description: Accès non trouvé
 */
router.delete('/:id', 
  rbacMiddleware.requirePermission('accesses.delete'),
  accessesValidation.validateAccessId,
  accessesController.deleteAccess
);

/**
 * @swagger
 * /api/accesses/{id}/hard:
 *   delete:
 *     summary: Supprimer définitivement un accès
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'accès
 *     responses:
 *       200:
 *         description: Accès supprimé définitivement avec succès
 *       404:
 *         description: Accès non trouvé
 */
router.delete('/:id/hard', 
  rbacMiddleware.requirePermission('accesses.hard_delete'),
  accessesValidation.validateAccessId,
  accessesController.hardDeleteAccess
);

/**
 * @swagger
 * /api/accesses/user/{userId}/roles:
 *   get:
 *     summary: Récupérer les rôles d'un utilisateur
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Uniquement les rôles actifs
 *     responses:
 *       200:
 *         description: Rôles de l'utilisateur récupérés avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/user/:userId/roles', 
  rbacMiddleware.requirePermission('accesses.read'),
  accessesValidation.validateUserId,
  accessesValidation.validateQueryParams,
  accessesController.getUserRoles
);

/**
 * @swagger
 * /api/accesses/role/{roleId}/users:
 *   get:
 *     summary: Récupérer les utilisateurs ayant un rôle spécifique
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID du rôle
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Uniquement les utilisateurs actifs
 *     responses:
 *       200:
 *         description: Utilisateurs du rôle récupérés avec succès
 *       404:
 *         description: Rôle non trouvé
 */
router.get('/role/:roleId/users', 
  rbacMiddleware.requirePermission('accesses.read'),
  accessesValidation.validateRoleId,
  accessesValidation.validateQueryParams,
  accessesController.getRoleUsers
);

/**
 * @swagger
 * /api/accesses/user/{userId}/role/{roleId}:
 *   get:
 *     summary: Vérifier si un utilisateur a un rôle spécifique
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'utilisateur
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID du rôle
 *       - in: query
 *         name: onlyActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Uniquement les accès actifs
 *     responses:
 *       200:
 *         description: Vérification de rôle effectuée avec succès
 */
router.get('/user/:userId/role/:roleId', 
  rbacMiddleware.requirePermission('accesses.read'),
  accessesValidation.validateUserIdAndRoleId,
  accessesValidation.validateQueryParams,
  accessesController.checkUserHasRole
);

/**
 * @swagger
 * /api/accesses/user/{userId}/roles/assign:
 *   post:
 *     summary: Assigner plusieurs rôles à un utilisateur
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 description: Liste des IDs de rôles à assigner
 *     responses:
 *       200:
 *         description: Assignation multiple terminée avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Utilisateur ou rôles non trouvés
 */
router.post('/user/:userId/roles/assign', 
  rbacMiddleware.requirePermission('accesses.assign'),
  accessesValidation.validateUserId,
  accessesValidation.validateAssignMultipleRoles,
  accessesController.assignMultipleRoles
);

/**
 * @swagger
 * /api/accesses/user/{userId}/roles/remove:
 *   post:
 *     summary: Retirer plusieurs rôles d'un utilisateur
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: Object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                 description: Liste des IDs de rôles à retirer
 *     responses:
 *       200:
 *         description: Retrait multiple terminé avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post('/user/:userId/roles/remove', 
  rbacMiddleware.requirePermission('accesses.remove'),
  accessesValidation.validateUserId,
  accessesValidation.validateRemoveMultipleRoles,
  accessesController.removeMultipleRoles
);

/**
 * @swagger
 * /api/accesses/stats:
 *   get:
 *     summary: Récupérer les statistiques des accès
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *       501:
 *         description: Fonctionnalité non implémentée
 */
router.get('/stats', 
  rbacMiddleware.requirePermission('accesses.read'),
  accessesController.getAccessStats
);

module.exports = router;
