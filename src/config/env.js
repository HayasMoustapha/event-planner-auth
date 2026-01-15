require('dotenv').config();

const configValidation = require('./validation');

/**
 * Configuration de l'application avec validation
 * Valide toutes les variables d'environnement au démarrage
 */
const env = configValidation.validateConfig();

module.exports = env;
