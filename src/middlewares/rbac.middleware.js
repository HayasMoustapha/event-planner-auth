const usersRepository = require('../modules/users/users.repository');

const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Accès non autorisé',
          message: 'Authentication requise'
        });
      }

      // Récupérer les permissions de l'utilisateur
      const userPermissions = await usersRepository.getUserPermissions(req.user.id);
      
      // Vérifier si l'utilisateur a la permission requise
      const hasPermission = userPermissions.some(p => 
        p.name === permission || 
        (p.resource === permission.split('.')[0] && p.action === permission.split('.')[1])
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Permission insuffisante',
          required: permission
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Erreur interne',
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Accès non autorisé',
          message: 'Authentication requise'
        });
      }

      // Récupérer les rôles de l'utilisateur
      const userRoles = await usersRepository.getUserRoles(req.user.id);
      
      // Vérifier si l'utilisateur a le rôle requis
      const hasRole = userRoles.some(role => role.name === roleName);

      if (!hasRole) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Rôle requis',
          required: roleName
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Erreur interne',
        message: 'Erreur lors de la vérification des rôles'
      });
    }
  };
};

const requireAnyRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Accès non autorisé',
          message: 'Authentication requise'
        });
      }

      // Récupérer les rôles de l'utilisateur
      const userRoles = await usersRepository.getUserRoles(req.user.id);
      
      // Vérifier si l'utilisateur a au moins un des rôles requis
      const hasAnyRole = userRoles.some(role => roleNames.includes(role.name));

      if (!hasAnyRole) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Un des rôles suivants est requis',
          required: roleNames
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Erreur interne',
        message: 'Erreur lors de la vérification des rôles'
      });
    }
  };
};

const requireAllRoles = (roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Accès non autorisé',
          message: 'Authentication requise'
        });
      }

      // Récupérer les rôles de l'utilisateur
      const userRoles = await usersRepository.getUserRoles(req.user.id);
      const userRoleNames = userRoles.map(role => role.name);
      
      // Vérifier si l'utilisateur a tous les rôles requis
      const hasAllRoles = roleNames.every(roleName => userRoleNames.includes(roleName));

      if (!hasAllRoles) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Tous les rôles suivants sont requis',
          required: roleNames
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Erreur interne',
        message: 'Erreur lors de la vérification des rôles'
      });
    }
  };
};

// Middleware pour vérifier si l'utilisateur peut accéder à sa propre ressource
const requireOwnershipOrRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Accès non autorisé',
          message: 'Authentication requise'
        });
      }

      const targetUserId = req.params.id || req.params.userId;
      
      // Vérifier si l'utilisateur accède à sa propre ressource
      if (req.user.id === parseInt(targetUserId)) {
        return next();
      }

      // Sinon, vérifier si l'utilisateur a le rôle requis
      const userRoles = await usersRepository.getUserRoles(req.user.id);
      const hasRole = userRoles.some(role => role.name === roleName);

      if (!hasRole) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Vous ne pouvez accéder qu\'à vos propres ressources ou avoir le rôle requis',
          required: roleName
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Erreur interne',
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireRole,
  requireAnyRole,
  requireAllRoles,
  requireOwnershipOrRole
};
