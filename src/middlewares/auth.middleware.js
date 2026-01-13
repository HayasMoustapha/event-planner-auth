const jwtConfig = require('../config/jwt');
const usersRepository = require('../modules/users/users.repository');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Accès non autorisé',
        message: 'Token manquant ou invalide'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwtConfig.verifyToken(token);
      
      // Vérifier si l'utilisateur existe et est actif
      const user = await usersRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Accès non autorisé',
          message: 'Utilisateur inexistant ou désactivé'
        });
      }

      // Ajouter les informations de l'utilisateur à la requête
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Accès non autorisé',
        message: 'Token invalide ou expiré'
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de l\'authentification'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwtConfig.verifyToken(token);
      
      const user = await usersRepository.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          username: decoded.username
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional authentication
    }

    next();
  } catch (error) {
    next(); // Continue without authentication on other errors
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
