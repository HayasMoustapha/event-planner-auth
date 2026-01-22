const logger = require('./logger');
const { getErrorMessage } = require('./error-messages');

/**
 * Utilitaire de gestion des erreurs pour les services et repositories
 * Centralise la gestion des erreurs avec logging approprié
 */

/**
 * Gère les erreurs de base de données
 * @param {Error} error - Erreur à gérer
 * @param {string} operation - Opération en cours
 * @param {Object} context - Contexte supplémentaire
 * @throws {Error} Erreur formatée
 */
const handleDatabaseError = (error, operation, context = {}) => {
  logger.error(`Database error in ${operation}`, {
    error: error.message,
    stack: error.stack,
    operation,
    ...context
  });

  // Erreurs PostgreSQL courantes
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        throw new Error('Entrée en double : cette donnée existe déjà');
      case '23503': // Foreign key violation
        throw new Error('Référence invalide : cette donnée est liée à une autre ressource');
      case '23502': // Not null violation
        throw new Error('Champ requis manquant');
      case '42P01': // Syntax error
        throw new Error('Erreur de syntaxe dans la requête');
      case '42703': // Undefined function
        throw new Error('Fonction non définie');
      case '42883': // Undefined table
        throw new Error('Table non définie');
      case '42704': // Undefined column
        throw new Error('Colonne non définie');
      default:
        throw new Error(`Erreur de base de données : ${error.message}`);
    }
  }

  throw new Error(`Erreur de base de données : ${error.message}`);
};

/**
 * Gère les erreurs de validation
 * @param {Error} error - Erreur à gérer
 * @param {string} field - Champ concerné
 * @param {Object} context - Contexte supplémentaire
 * @throws {Error} Erreur formatée
 */
const handleValidationError = (error, field, context = {}) => {
  logger.warn(`Validation error for field ${field}`, {
    error: error.message,
    field,
    ...context
  });

  throw new Error(`Erreur de validation pour le champ ${field}: ${error.message}`);
};

/**
 * Gère les erreurs d'authentification
 * @param {Error} error - Erreur à gérer
 * @param {string} operation - Opération en cours
 * @param {Object} context - Contexte supplémentaire
 * @throws {Error} Erreur formatée
 */
const handleAuthError = (error, operation, context = {}) => {
  logger.warn(`Auth error in ${operation}`, {
    error: error.message,
    operation,
    ...context
  });

  // Erreurs d'authentification courantes
  if (error.message.includes('Invalid credentials')) {
    throw new Error('Identifiants invalides');
  } else if (error.message.includes('Token expired')) {
    throw new Error('Token expiré');
  } else if (error.message.includes('Token invalid')) {
    throw new Error('Token invalide');
  } else if (error.message.includes('Account locked')) {
    throw new Error('Compte verrouillé');
  } else if (error.message.includes('Email not verified')) {
    throw new Error('Email non vérifié');
  }

  throw new Error(`Erreur d'authentification : ${error.message}`);
};

/**
 * Gère les erreurs de service externe
 * @param {Error} error - Erreur à gérer
 * @param {string} service - Service concerné
 * @param {Object} context - Contexte supplémentaire
 * @throws {Error} Erreur formatée
 */
const handleExternalServiceError = (error, service, context = {}) => {
  logger.error(`External service error: ${service}`, {
    error: error.message,
    service,
    ...context
  });

  // Erreurs de services externes courants
  if (error.code === 'ECONNREFUSED') {
    throw new Error(`Service ${service} indisponible`);
  } else if (error.code === 'ETIMEDOUT') {
    throw new Error(`Délai d'attente dépassé pour le service ${service}`);
  } else if (error.response && error.response.status === 429) {
    throw new Error(`Trop de requêtes vers le service ${service}`);
  }

  throw new Error(`Erreur du service ${service}: ${error.message}`);
};

/**
 * Gère les erreurs générales
 * @param {Error} error - Erreur à gérer
 * @param {string} operation - Opération en cours
 * @param {Object} context - Contexte supplémentaire
 * @throws {Error} Erreur formatée
 */
const handleGenericError = (error, operation, context = {}) => {
  logger.error(`Error in ${operation}`, {
    error: error.message,
    stack: error.stack,
    operation,
    ...context
  });

  throw new Error(`Erreur lors de ${operation}: ${error.message}`);
};

/**
 * Wrapper pour les fonctions async avec gestion d'erreurs
 * @param {Function} fn - Fonction à wrapper
 * @param {string} operation - Nom de l'opération
 * @param {Object} context - Contexte supplémentaire
 * @returns {Function} Fonction wrappée
 */
const withErrorHandling = (fn, operation, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleGenericError(error, operation, { ...context, args });
    }
  };
};

/**
 * Wrapper pour les fonctions de base de données
 * @param {Function} fn - Fonction à wrapper
 * @param {string} operation - Nom de l'opération
 * @param {Object} context - Contexte supplémentaire
 * @returns {Function} Fonction wrappée
 */
const withDatabaseErrorHandling = (fn, operation, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleDatabaseError(error, operation, { ...context, args });
    }
  };
};

module.exports = {
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleExternalServiceError,
  handleGenericError,
  withErrorHandling,
  withDatabaseErrorHandling
};
