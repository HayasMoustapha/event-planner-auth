/**
 * Messages d'erreur standardisés pour l'application
 * Codes d'erreur structurés avec messages multilingues
 */

const errorMessages = {
  // Erreurs d'authentification
  AUTH: {
    INVALID_CREDENTIALS: {
      code: 'INVALID_CREDENTIALS',
      message: 'Identifiants invalides',
      details: 'L\'email ou le mot de passe fournis sont incorrects.'
    },
    INVALID_EMAIL_FORMAT: {
      code: 'INVALID_EMAIL_FORMAT',
      message: 'Format d\'email invalide',
      details: 'L\'email doit être au format nom@domaine.com.'
    },
    INVALID_PHONE_FORMAT: {
      code: 'INVALID_PHONE_FORMAT',
      message: 'Format de téléphone invalide',
      details: 'Le numéro de téléphone doit contenir uniquement des chiffres, +, espaces ou tirets.'
    },
    PASSWORD_TOO_SHORT: {
      code: 'PASSWORD_TOO_SHORT',
      message: 'Mot de passe trop court',
      details: 'Le mot de passe doit contenir au moins 8 caractères.'
    },
    PASSWORD_TOO_WEAK: {
      code: 'PASSWORD_TOO_WEAK',
      message: 'Mot de passe trop faible',
      details: 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.'
    },
    PASSWORD_TOO_COMMON: {
      code: 'PASSWORD_TOO_COMMON',
      message: 'Mot de passe trop commun',
      details: 'Ce mot de passe est trop courant. Veuillez en choisir un plus sécurisé.'
    },
    ACCOUNT_LOCKED: {
      code: 'ACCOUNT_LOCKED',
      message: 'Compte verrouillé',
      details: 'Votre compte a été verrouillé pour des raisons de sécurité. Veuillez contacter l\'administrateur.'
    },
    EMAIL_NOT_VERIFIED: {
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Email non vérifié',
      details: 'Veuillez vérifier votre adresse email avant de continuer.'
    },
    TOKEN_EXPIRED: {
      code: 'TOKEN_EXPIRED',
      message: 'Token expiré',
      details: 'Votre session a expiré. Veuillez vous reconnecter.'
    },
    TOKEN_INVALID: {
      code: 'TOKEN_INVALID',
      message: 'Token invalide',
      details: 'Le token fourni n\'est pas valide.'
    }
  },

  // Erreurs de validation
  VALIDATION: {
    INVALID_EMAIL_FORMAT: {
      code: 'INVALID_EMAIL_FORMAT',
      message: 'Format d\'email invalide',
      details: 'L\'email doit être au format nom@domaine.com.'
    },
    INVALID_PHONE_FORMAT: {
      code: 'INVALID_PHONE_FORMAT',
      message: 'Format de téléphone invalide',
      details: 'Le numéro de téléphone doit être au format international.'
    },
    PASSWORD_TOO_SHORT: {
      code: 'PASSWORD_TOO_SHORT',
      message: 'Mot de passe trop court',
      details: 'Le mot de passe doit contenir au moins 8 caractères.'
    },
    PASSWORD_TOO_WEAK: {
      code: 'PASSWORD_TOO_WEAK',
      message: 'Mot de passe trop faible',
      details: 'Le mot de passe doit contenir des lettres majuscules, minuscules et chiffres.'
    },
    PASSWORD_TOO_COMMON: {
      code: 'PASSWORD_TOO_COMMON',
      message: 'Mot de passe trop commun',
      details: 'Ce mot de passe est dans la liste des mots de passe interdits.'
    },
    INVALID_INPUT: {
      code: 'INVALID_INPUT',
      message: 'Données invalides',
      details: 'Les données fournies ne sont pas valides.'
    }
  },

  // Erreurs de base de données
  DATABASE: {
    CONNECTION_FAILED: {
      code: 'DATABASE_CONNECTION_FAILED',
      message: 'Échec de connexion à la base de données',
      details: 'Impossible de se connecter à la base de données. Veuillez réessayer plus tard.'
    },
    QUERY_FAILED: {
      code: 'DATABASE_QUERY_FAILED',
      message: 'Échec de la requête',
      details: 'Une erreur est survenue lors de l\'exécution de la requête.'
    },
    CONSTRAINT_VIOLATION: {
      code: 'DATABASE_CONSTRAINT_VIOLATION',
      message: 'Violation de contrainte',
      details: 'Une contrainte de la base de données a été violée.'
    },
    DUPLICATE_ENTRY: {
      code: 'DATABASE_DUPLICATE_ENTRY',
      message: 'Entrée en double',
      details: 'Cet enregistrement existe déjà dans la base de données.'
    }
  },

  // Erreurs de sécurité
  SECURITY: {
    RATE_LIMIT_EXCEEDED: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Limite de taux dépassée',
      details: 'Trop de requêtes. Veuillez réessayer plus tard.'
    },
    INVALID_TOKEN: {
      code: 'INVALID_TOKEN',
      message: 'Token invalide',
      details: 'Le token fourni n\'est pas valide ou a expiré.'
    },
    UNAUTHORIZED_ACCESS: {
      code: 'UNAUTHORIZED_ACCESS',
      message: 'Accès non autorisé',
      details: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.'
    },
    FORBIDDEN_ACCESS: {
      code: 'FORBIDDEN_ACCESS',
      message: 'Accès interdit',
      details: 'Vous n\'êtes pas autorisé à accéder à cette ressource.'
    },
    SUSPICIOUS_ACTIVITY: {
      code: 'SUSPICIOUS_ACTIVITY',
      message: 'Activité suspecte détectée',
      details: 'Une activité suspecte a été détectée. Votre session peut être terminée.'
    }
  },

  // Erreurs générales
  GENERAL: {
    INTERNAL_ERROR: {
      code: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur',
      details: 'Une erreur inattendue est survenue. Veuillez réessayer.'
    },
    VALIDATION_ERROR: {
      code: 'VALIDATION_ERROR',
      message: 'Erreur de validation',
      details: 'Les données fournies ne sont pas valides.'
    },
    NOT_FOUND: {
      code: 'NOT_FOUND',
      message: 'Ressource non trouvée',
      details: 'La ressource demandée n\'existe pas.'
    },
    SERVICE_UNAVAILABLE: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service indisponible',
      details: 'Le service demandé est temporairement indisponible.'
    }
  },

  // Erreurs OAuth
  OAUTH: {
    INVALID_TOKEN: {
      code: 'OAUTH_INVALID_TOKEN',
      message: 'Token OAuth invalide',
      details: 'Le token OAuth fourni n\'est pas valide ou a expiré.'
    },
    CONFIGURATION_ERROR: {
      code: 'OAUTH_CONFIG_ERROR',
      message: 'Configuration OAuth invalide',
      details: 'La configuration OAuth n\'est pas correcte.'
    },
    PROVIDER_ERROR: {
      code: 'OAUTH_PROVIDER_ERROR',
      message: 'Erreur du fournisseur OAuth',
      details: 'Une erreur est survenue lors de la communication avec le fournisseur OAuth.'
    }
  }
};

/**
 * Obtient un message d'erreur formaté
 * @param {string} code - Code d'erreur
 * @param {Object} options - Options supplémentaires
 * @returns {Object} Message d'erreur formaté
 */
const getErrorMessage = (code, options = {}) => {
  const errorGroup = Object.keys(errorMessages).find(group => 
    errorMessages[group] && errorMessages[group][code]
  );
  
  if (!errorGroup) {
    return {
      success: false,
      message: 'Erreur inconnue',
      code: 'UNKNOWN_ERROR'
    };
  }
  
  const error = errorGroup[code];
  return {
    success: false,
    message: error.message,
    code: error.code,
    details: error.details || '',
    ...options
  };
};

module.exports = {
  errorMessages,
  getErrorMessage
};
