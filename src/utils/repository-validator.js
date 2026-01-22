const Joi = require('joi');

/**
 * Utilitaire de validation pour les repositories
 * Valide les options et paramètres des requêtes
 */

/**
 * Schéma de validation pour les options de pagination et recherche
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(255).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  userAccess: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Schéma de validation pour les IDs
 */
const idSchema = Joi.number().integer().min(1).required();

/**
 * Schéma de validation pour les IDs optionnels
 */
const optionalIdSchema = Joi.number().integer().min(1).optional();

/**
 * Schéma de validation pour les emails
 */
const emailSchema = Joi.string().email().max(254).optional();

/**
 * Schéma de validation pour les téléphones
 */
const phoneSchema = Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(20).optional();

/**
 * Schéma de validation pour les usernames
 */
const usernameSchema = Joi.string().alphanum().min(3).max(20).optional();

/**
 * Valide les options de pagination
 * @param {Object} options - Options à valider
 * @returns {Object} Options validées
 */
const validatePaginationOptions = (options) => {
  const { error, value } = paginationSchema.validate(options);
  
  if (error) {
    throw new Error(`Options de pagination invalides: ${error.details.map(d => d.message).join(', ')}`);
  }
  
  return value;
};

/**
 * Valide un ID
 * @param {number} id - ID à valider
 * @returns {number} ID validé
 */
const validateId = (id) => {
  const { error, value } = idSchema.validate(id);
  
  if (error) {
    throw new Error(`ID invalide: ${error.details[0].message}`);
  }
  
  return value;
};

/**
 * Valide un ID optionnel
 * @param {number} id - ID à valider
 * @returns {number|null} ID validé ou null
 */
const validateOptionalId = (id) => {
  if (id === null || id === undefined) {
    return null;
  }
  
  const { error, value } = optionalIdSchema.validate(id);
  
  if (error) {
    throw new Error(`ID invalide: ${error.details[0].message}`);
  }
  
  return value;
};

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {string|null} Email validé ou null
 */
const validateEmail = (email) => {
  if (email === null || email === undefined) {
    return null;
  }
  
  const { error, value } = emailSchema.validate(email);
  
  if (error) {
    throw new Error(`Email invalide: ${error.details[0].message}`);
  }
  
  return value;
};

/**
 * Valide un numéro de téléphone
 * @param {string} phone - Téléphone à valider
 * @returns {string|null} Téléphone validé ou null
 */
const validatePhone = (phone) => {
  if (phone === null || phone === undefined) {
    return null;
  }
  
  const { error, value } = phoneSchema.validate(phone);
  
  if (error) {
    throw new Error(`Téléphone invalide: ${error.details[0].message}`);
  }
  
  return value;
};

/**
 * Valide un username
 * @param {string} username - Username à valider
 * @returns {string|null} Username validé ou null
 */
const validateUsername = (username) => {
  if (username === null || username === undefined) {
    return null;
  }
  
  const { error, value } = usernameSchema.validate(username);
  
  if (error) {
    throw new Error(`Username invalide: ${error.details[0].message}`);
  }
  
  return value;
};

/**
 * Valide et nettoie les options de recherche
 * @param {Object} options - Options à valider
 * @returns {Object} Options validées et nettoyées
 */
const validateSearchOptions = (options) => {
  const validated = validatePaginationOptions(options);
  
  // Nettoyer les chaînes de recherche
  if (validated.search) {
    validated.search = validated.search.trim();
  }
  
  return validated;
};

module.exports = {
  validatePaginationOptions,
  validateId,
  validateOptionalId,
  validateEmail,
  validatePhone,
  validateUsername,
  validateSearchOptions,
  paginationSchema,
  idSchema,
  emailSchema,
  phoneSchema,
  usernameSchema
};
