const crypto = require('crypto');
const otpRepository = require('./otp.repository');

/**
 * Service métier pour la gestion des OTP (One-Time Password)
 * Contient la logique de génération, validation et gestion des OTP
 */
class OtpService {
  /**
   * Génère un code OTP aléatoire
   * @param {number} length - Longueur du code (défaut: 6)
   * @returns {string} Code OTP généré
   */
  generateCode(length = 6) {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(crypto.randomInt(0, chars.length - 1));
    }
    return code;
  }

  /**
   * Génère et sauvegarde un OTP pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type d'OTP ('email' ou 'phone')
   * @param {string} identifier - Email ou numéro de téléphone
   * @param {number} expiresInMinutes - Durée de validité en minutes (défaut: 15)
   * @param {number} createdBy - ID de l'utilisateur qui crée l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async generateOtp(userId, type, identifier, expiresInMinutes = 15, createdBy = null) {
    // Validation des paramètres
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }
    
    if (!type || !['email', 'phone'].includes(type)) {
      throw new Error('Type d\'OTP invalide. Valeurs autorisées: email, phone');
    }
    
    if (!identifier || !identifier.trim()) {
      throw new Error('Identifiant (email/téléphone) requis');
    }
    
    if (expiresInMinutes < 1 || expiresInMinutes > 60) {
      throw new Error('La durée de validité doit être entre 1 et 60 minutes');
    }

    // Vérifier s'il n'y a pas déjà un OTP actif pour cet utilisateur et type
    const activeOtpCount = await otpRepository.countActiveOtp(userId, type);
    if (activeOtpCount >= 3) {
      throw new Error('Trop de codes OTP actifs pour cet utilisateur. Veuillez patienter avant de générer un nouveau code.');
    }

    // Générer le code
    const code = this.generateCode();
    
    // Calculer la date d'expiration
    const expiresAt = new Date(Date.now() + (expiresInMinutes * 60 * 1000));

    // Créer l'OTP
    const otpData = {
      userId,
      type,
      identifier: identifier.toLowerCase().trim(),
      code,
      expiresAt,
      createdBy
    };

    return await otpRepository.create(otpData);
  }

  /**
   * Génère un OTP pour l'email
   * @param {number} userId - ID de l'utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {number} expiresInMinutes - Durée de validité
   * @param {number} createdBy - ID de l'utilisateur qui crée l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async generateEmailOtp(userId, email, expiresInMinutes = 15, createdBy = null) {
    if (!email || !email.trim()) {
      throw new Error('Email requis');
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s*[^@\s]+@[^@\s]+\.[^@\s]+\s*$/;
    if (!emailRegex.test(email)) {
      throw new Error('Format d\'email invalide');
    }

    return await this.generateOtp(userId, 'email', email, expiresInMinutes, createdBy);
  }

  /**
   * Génère un OTP pour le téléphone
   * @param {number} userId - ID de l'utilisateur
   * @param {string} phone - Numéro de téléphone
   * @param {number} expiresInMinutes - Durée de validité
   * @param {number} createdBy - ID de l'utilisateur qui crée l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async generatePhoneOtp(userId, phone, expiresInMinutes = 15, createdBy = null) {
    if (!phone || !phone.trim()) {
      throw new Error('Numéro de téléphone requis');
    }

    // Nettoyer le numéro de téléphone
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Validation basique du numéro de téléphone
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error('Numéro de téléphone invalide');
    }

    return await this.generateOtp(userId, 'phone', phone, expiresInMinutes, createdBy);
  }

  /**
   * Vérifie un code OTP
   * @param {string} code - Code OTP à vérifier
   * @param {string} identifier - Email ou téléphone
   * @param {string} type - Type d'OTP ('email' ou 'phone')
   * @param {number} userId - ID de l'utilisateur (optionnel, pour validation)
   * @returns {Promise<Object>} OTP validé et marqué comme utilisé
   */
  async verifyOtp(code, identifier, type, userId = null) {
    // Validation des paramètres
    if (!code || !code.trim()) {
      throw new Error('Code OTP requis');
    }
    
    if (!identifier || !identifier.trim()) {
      throw new Error('Identifiant requis');
    }
    
    if (!type || !['email', 'phone'].includes(type)) {
      throw new Error('Type d\'OTP invalide');
    }

    if (code.length < 4 || code.length > 10) {
      throw new Error('Code OTP invalide');
    }

    // Normaliser l'identifiant
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Vérifier et marquer comme utilisé
    const otp = await otpRepository.validateOtp(code, normalizedIdentifier, type);
    
    if (!otp) {
      throw new Error('Code OTP invalide ou expiré');
    }

    // Validation optionnelle de l'utilisateur
    if (userId && otp.user_id !== userId) {
      throw new Error('Ce code OTP n\'est pas associé à cet utilisateur');
    }

    // Vérifier si l'OTP n'est pas expiré
    if (new Date(otp.expires_at) < new Date()) {
      throw new Error('Code OTP expiré');
    }

    return {
      id: otp.id,
      type: otp.type,
      identifier: otp.identifier,
      expiresAt: otp.expires_at,
      createdAt: otp.created_at
    };
  }

  /**
   * Vérifie un code OTP pour l'email
   * @param {string} code - Code OTP
   * @param {string} email - Email de l'utilisateur
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>} OTP validé
   */
  async verifyEmailOtp(code, email, userId = null) {
    return await this.verifyOtp(code, email, 'email', userId);
  }

  /**
   * Vérifie un code OTP pour le téléphone
   * @param {string} code - Code OTP
   * @param {string} phone - Numéro de téléphone
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>} OTP validé
   */
  async verifyPhoneOtp(code, phone, userId = null) {
    return await this.verifyOtp(code, phone, 'phone', userId);
  }

  /**
   * Récupère tous les OTP d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type d'OTP (optionnel)
   * @returns {Promise<Array>} Liste des OTP
   */
  async getUserOtps(userId, type = null) {
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    return await otpRepository.findByUserId(userId, type);
  }

  /**
   * Invalide tous les OTP d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type d'OTP (optionnel)
   * @returns {Promise<number>} Nombre d'OTP invalidés
   */
  async invalidateUserOtps(userId, type = null) {
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    const otps = await this.getUserOtps(userId, type);
    let invalidatedCount = 0;

    for (const otp of otps) {
      if (!otp.is_used) {
        await otpRepository.markAsUsed(otp.id);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Vérifie si un utilisateur a des OTP actifs
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type d'OTP (optionnel)
   * @returns {Promise<boolean>} True si l'utilisateur a des OTP actifs
   */
  async hasActiveOtp(userId, type = null) {
    const count = await otpRepository.countActiveOtp(userId, type);
    return count > 0;
  }

  /**
   * Nettoie les OTP expirés
   * @returns {Promise<number>} Nombre d'OTP supprimés
   */
  async cleanupExpiredOtps() {
    return await otpRepository.deleteExpired();
  }

  /**
   * Nettoie tous les OTP d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} Nombre d'OTP supprimés
   */
  async cleanupUserOtps(userId) {
    if (!userId || userId <= 0) {
      throw new Error('ID utilisateur invalide');
    }

    return await otpRepository.deleteByUserId(userId);
  }

  /**
   * Récupère les statistiques sur les OTP
   * @returns {Promise<Object>} Statistiques
   */
  async getOtpStats() {
    try {
      return await otpRepository.getStats();
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques OTP: ${error.message}`);
    }
  }

  /**
   * Génère un OTP pour la réinitialisation de mot de passe
   * @param {number} userId - ID de l'utilisateur
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} OTP de réinitialisation
   */
  async generatePasswordResetOtp(userId, email) {
    // Générer un OTP avec une durée plus longue pour la réinitialisation
    return await this.generateEmailOtp(userId, email, 30, userId);
  }

  /**
   * Vérifie un OTP pour la réinitialisation de mot de passe
   * @param {string} code - Code OTP
   * @param {string} email - Email de l'utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} OTP validé pour réinitialisation
   */
  async verifyPasswordResetOtp(code, email, userId) {
    const otp = await this.verifyEmailOtp(code, email, userId);
    
    if (otp) {
      // Ajouter une log pour la réinitialisation
      console.log(`🔐 Réinitialisation mot de passe pour l'utilisateur ${userId} via email ${email}`);
    }

    return otp;
  }
}

module.exports = new OtpService();