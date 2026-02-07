const express = require('express');
const usersController = require('../users/users.controller'); // CORRECTION: Utiliser usersController
const { createResponse } = require('../../utils/response');
const peopleRepository = require('../people/people.repository');
const usersRepository = require('../users/users.repository');
const usersService = require('../users/users.service');
const authService = require('./auth.service');
const permissionsService = require('../../services/permissions.service');
const { connection } = require('../../config/database');

const router = express.Router();

/**
 * Routes internes pour la communication inter-services
 * Ces routes utilisent un token de service dédié au lieu des tokens utilisateur
 * SEULEMENT les routes de lecture sont autorisées pour respecter l'isolation des services
 */

// Middleware pour valider le token de service
const validateServiceToken = (req, res, next) => {
  const serviceToken = req.headers['x-service-token'];
  
  if (!serviceToken) {
    return res.status(401).json(createResponse(
      false,
      'Service token required for inter-service communication',
      { code: 'SERVICE_TOKEN_REQUIRED' }
    ));
  }
  
  const expectedToken = process.env.SHARED_SERVICE_TOKEN || 'shared-service-token-abcdef12345678901234567890';
  
  if (serviceToken !== expectedToken) {
    return res.status(401).json(createResponse(
      false,
      'Invalid service token',
      { code: 'INVALID_SERVICE_TOKEN' }
    ));
  }
  
  next();
};

// Appliquer le middleware de validation à toutes les routes internes
router.use(validateServiceToken);

/**
 * Routes internes LECTURE SEULEMENT pour la communication inter-services
 */

// Route pour récupérer les utilisateurs (utilisé par event-planner-core)
router.get('/users', usersController.getAll);

// Route pour récupérer un utilisateur par ID (utilisé par event-planner-core)
router.get('/users/:id', usersController.getById);

// Route pour récupérer un utilisateur par email (utilisé par event-planner-core)
router.get('/users/email/:email', usersController.getByEmail);

// Route pour récupérer un utilisateur par username (utilisé par event-planner-core)
router.get('/users/username/:username', usersController.getByUsername);

// Route pour rechercher des utilisateurs (utilisé par event-planner-core)
router.get('/users/search', usersController.search);

// Route pour récupérer les statistiques des utilisateurs (utilisé par event-planner-core)
router.get('/users/stats', usersController.getStats);

// Route pour vérifier l'existence d'un utilisateur (utilisé par event-planner-core)
router.get('/users/:id/exists', usersController.exists);

const sanitizeUsername = (email) => {
  const localPart = (email || '').split('@')[0] || 'guest';
  const normalized = localPart.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50);
  return normalized.length >= 3 ? normalized : `guest_${Date.now().toString().slice(-4)}`;
};

/**
 * Route interne: création d'un compte invité (people + user) sans OTP
 * @route POST /api/internal/auth/guests
 */
router.post('/guests', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body || {};

    if (!email) {
      return res.status(400).json(createResponse(false, 'Email requis', { code: 'EMAIL_REQUIRED' }));
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const defaultPassword = password || process.env.GUEST_DEFAULT_PASSWORD || 'Guest123!';

    let person = await peopleRepository.findByEmail(normalizedEmail);
    if (!person) {
      person = await peopleRepository.create({
        first_name: first_name || 'Invité',
        last_name: last_name || null,
        email: normalizedEmail,
        phone: phone || null,
        status: 'active'
      });
    }

    let user = await usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      const username = sanitizeUsername(normalizedEmail);
      const userCode = await usersService.generateUniqueUserCode();
      user = await usersRepository.create({
        username,
        email: normalizedEmail,
        password: defaultPassword,
        userCode,
        phone: phone || null,
        status: 'active',
        person_id: person.id
      });
    }

    // Assigner automatiquement le rôle 'user' si disponible
    try {
      const roleResult = await connection.query(
        `SELECT id FROM roles WHERE code = 'user' AND deleted_at IS NULL LIMIT 1`
      );
      const roleId = roleResult?.rows?.[0]?.id;
      if (roleId) {
        await connection.query(
          `INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
           VALUES ($1, $2, 'active', NOW(), NOW())
           ON CONFLICT (user_id, role_id) DO NOTHING`,
          [user.id, roleId]
        );
      }
    } catch (error) {
      // Ne pas bloquer la création si l'assignation échoue
    }

    let roles = null;
    let permissions = null;
    try {
      roles = await permissionsService.getUserRoles(user.id);
      permissions = await permissionsService.getUserPermissions(user.id);
    } catch (error) {
      roles = ['user'];
      permissions = [];
    }

    const loginToken = authService.generateToken(user, { roles, permissions });
    const authBaseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
    const loginUrl = `${authBaseUrl}/api/auth/login/${loginToken}`;

    return res.status(200).json(createResponse(true, 'Guest account ready', {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        status: user.status
      },
      loginToken,
      loginUrl,
      defaultPassword
    }));
  } catch (error) {
    return res.status(500).json(createResponse(false, 'Failed to create guest account', {
      code: 'GUEST_ACCOUNT_FAILED',
      details: error.message
    }));
  }
});

module.exports = router;
