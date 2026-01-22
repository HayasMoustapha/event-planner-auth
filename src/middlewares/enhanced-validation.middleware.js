const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Middleware de validation d'entrée amélioré
 * Ajoute des validateurs pour tous les champs sensibles
 * Validation de format email et téléphone
 * Validation de force des mots de passe
 */
const enhancedValidation = (req, res, next) => {
  try {
    // Validation de l'email avec format internationalisé
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }
    }

    // Validation du téléphone avec format international
    if (req.body.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(req.body.phone)) {
        return res.status(400).json({
          success: false,
          message: 'Format de téléphone invalide',
          code: 'INVALID_PHONE_FORMAT'
        });
      }
    }

    // Validation de la force du mot de passe
    if (req.body.password) {
      const password = req.body.password;
      
      // Longueur minimale
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères',
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      // Complexité minimale
      if (!/(?=.*[A-Z])/.test(password) || !/(?=.*[a-z])/.test(password) || !/(?=.*[0-9])/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre',
          code: 'PASSWORD_TOO_WEAK'
        });
      }

      // Pas de caractères communs évidents
      const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'azerty'];
      if (commonPasswords.includes(password.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe trop commun',
          code: 'PASSWORD_TOO_COMMON'
        });
      }
    }

    // Nettoyage des entrées
    const sanitizeInput = (input) => {
      if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
      }
      return input;
    };

    // Nettoyer les données du body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Enhanced validation middleware error', {
      error: error.message,
      ip: req.ip
    });
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation des entrées',
      code: 'VALIDATION_ERROR'
    });
  }
};

module.exports = enhancedValidation;
