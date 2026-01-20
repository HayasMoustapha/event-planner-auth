const { body } = require('express-validator');

/**
 * Validation pour la demande de réinitialisation de mot de passe
 */
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail()
    .withMessage('Format d\'email invalide')
];

/**
 * Validation pour la réinitialisation de mot de passe
 */
const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail()
    .withMessage('Format d\'email invalide'),
    
  body('token')
    .isLength({ min: 32, max: 64 })
    .withMessage('Le token doit faire entre 32 et 64 caractères')
    .withMessage('Le token est requis'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Le mot de passe doit faire entre 8 et 128 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

/**
 * Validation pour la récupération de l'historique
 */
const validatePasswordHistory = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
    
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100')
];

module.exports = {
  validatePasswordResetRequest,
  validatePasswordReset,
  validatePasswordHistory
};
