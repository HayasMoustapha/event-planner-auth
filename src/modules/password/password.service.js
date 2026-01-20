const crypto = require('crypto');
const bcrypt = require('bcrypt');
const passwordRepository = require('./password.repository');
const usersRepository = require('../users/users.repository');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Service métier pour la gestion des mots de passe
 * Gère la réinitialisation et l'historique des mots de passe
 */
class PasswordService {
  /**
   * Génère un token de réinitialisation sécurisé
   * @returns {string} Token de réinitialisation
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Demande une réinitialisation de mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Résultat de la demande
   */
  async requestPasswordReset(email) {
    try {
      // Vérifier si l'utilisateur existe
      const user = await usersRepository.findByEmail(email);
      if (!user) {
        // Pour des raisons de sécurité, ne pas révéler si l'email existe
        return {
          success: true,
          message: 'Si cet email existe, un email de réinitialisation a été envoyé'
        };
      }

      // Générer un token
      const resetToken = this.generateResetToken();
      
      // Sauvegarder le token en base
      await passwordRepository.createResetToken(email, resetToken);

      logger.info('Password reset requested', {
        userId: user.id,
        email: email
      });

      // TODO: Envoyer un email avec le token (nécessite le service email)
      // await emailService.sendPasswordResetEmail(email, resetToken);

      return {
        success: true,
        message: 'Email de réinitialisation envoyé',
        // En développement, retourner le token pour les tests
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      };
    } catch (error) {
      logger.error('Error requesting password reset', {
        email,
        error: error.message
      });
      throw new Error('Erreur lors de la demande de réinitialisation du mot de passe');
    }
  }

  /**
   * Réinitialise un mot de passe avec un token
   * @param {string} email - Email de l'utilisateur
   * @param {string} token - Token de réinitialisation
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<Object>} Résultat de la réinitialisation
   */
  async resetPassword(email, token, newPassword) {
    try {
      // Vérifier le token
      const resetTokenData = await passwordRepository.getResetToken(email);
      if (!resetTokenData || resetTokenData.token !== token) {
        return {
          success: false,
          message: 'Token de réinitialisation invalide ou expiré'
        };
      }

      // Vérifier l'âge du token (24h max)
      const tokenAge = Date.now() - new Date(resetTokenData.created_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      if (tokenAge > maxAge) {
        return {
          success: false,
          message: 'Token de réinitialisation expiré'
        };
      }

      // Récupérer l'utilisateur
      const user = await usersRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Ajouter l'ancien mot de passe à l'historique
      await passwordRepository.addPasswordHistory(user.id, user.password);

      // Mettre à jour le mot de passe de l'utilisateur
      await usersRepository.updatePassword(user.id, hashedPassword);

      // Supprimer le token utilisé
      await passwordRepository.deleteResetToken(email);

      logger.info('Password reset completed', {
        userId: user.id,
        email: email
      });

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };
    } catch (error) {
      logger.error('Error resetting password', {
        email,
        error: error.message
      });
      throw new Error('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  /**
   * Vérifie si un mot de passe a déjà été utilisé par un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<boolean>} True si déjà utilisé
   */
  async isPasswordAlreadyUsed(userId, password) {
    try {
      // Hasher le mot de passe pour comparaison
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Vérifier dans l'historique
      return await passwordRepository.isPasswordAlreadyUsed(userId, hashedPassword);
    } catch (error) {
      logger.error('Error checking password history', {
        userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Récupère l'historique des mots de passe d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Historique paginé
   */
  async getPasswordHistory(userId, options = {}) {
    try {
      return await passwordRepository.getPasswordHistory(userId, options);
    } catch (error) {
      logger.error('Error getting password history', {
        userId,
        error: error.message
      });
      throw new Error('Erreur lors de la récupération de l\'historique des mots de passe');
    }
  }
}

module.exports = new PasswordService();
