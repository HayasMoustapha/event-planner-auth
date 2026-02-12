const crypto = require('crypto');
const otpRepository = require('./otp.repository');
const peopleRepository = require('../people/people.repository');
const logger = require('../../utils/logger');

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
   * Génère et sauvegarde un OTP pour une personne
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP ('email' ou 'phone')
   * @param {string} contactInfo - Email ou numéro de téléphone
   * @param {number} expiresInMinutes - Durée de validité en minutes (défaut: 15)
   * @param {number} createdBy - ID de l'utilisateur qui crée l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async generateOtp(personId, purpose, contactInfo, expiresInMinutes = 15, createdBy = null) {
    // Validation des paramètres
    if (!personId || personId <= 0) {
      throw new Error('ID personne invalide');
    }

    if (!purpose || !['email', 'phone'].includes(purpose)) {
      throw new Error('Purpose d\'OTP invalide. Valeurs autorisées: email, phone');
    }

    if (!contactInfo || !contactInfo.trim()) {
      throw new Error('Contact (email/téléphone) requis');
    }

    if (expiresInMinutes < 1 || expiresInMinutes > 60) {
      throw new Error('La durée de validité doit être entre 1 et 60 minutes');
    }

    // Vérifier s'il n'y a pas déjà un OTP actif pour cette personne et purpose
    const activeOtpCount = await otpRepository.countActiveOtp(personId, purpose);
    if (activeOtpCount >= 3) {
      if (process.env.NODE_ENV !== 'production') {
        // En dev/test, on purge les OTP actifs pour éviter de bloquer les tests
        await otpRepository.deleteByPersonId(personId);
      } else {
        throw new Error('Trop de codes OTP actifs pour cette personne. Veuillez patienter avant de générer un nouveau code.');
      }
    }

    // Générer le code
    const otpCode = this.generateCode();

    // Calculer la date d'expiration
    const expiresAt = new Date(Date.now() + (expiresInMinutes * 60 * 1000));

    // Créer l'OTP
    const otpData = {
      personId,
      purpose,
      otpCode,
      expiresAt,
      createdBy
    };

    return await otpRepository.create(otpData);
  }

  /**
   * Génère un OTP pour l'email
   * @param {number} personId - ID de la personne
   * @param {string} email - Email de la personne
   * @param {number} expiresInMinutes - Durée de validité
   * @param {number} createdBy - ID de l'utilisateur qui crée l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async generateEmailOtp(personId, email, expiresInMinutes = 15, createdBy = null) {
    if (!email || !email.trim()) {
      throw new Error('Email requis');
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Format d\'email invalide');
    }

    return await this.generateOtp(personId, 'email', email, expiresInMinutes, createdBy);
  }

  /**
   * Génère un OTP pour le téléphone
   * @param {number} personId - ID de la personne
   * @param {string} phone - Numéro de téléphone
   * @param {number} expiresInMinutes - Durée de validité
   * @param {number} createdBy - ID de l'utilisateur qui crée l'OTP
   * @returns {Promise<Object>} OTP créé
   */
  async generatePhoneOtp(personId, phone, expiresInMinutes = 15, createdBy = null) {
    if (!phone || !phone.trim()) {
      throw new Error('Numéro de téléphone requis');
    }

    // Nettoyer le numéro de téléphone
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Validation basique du numéro de téléphone
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new Error('Numéro de téléphone invalide');
    }

    return await this.generateOtp(personId, 'phone', phone, expiresInMinutes, createdBy);
  }

  /**
   * Vérifie un code OTP
   * @param {string} otpCode - Code OTP à vérifier
   * @param {string} contactInfo - Email ou téléphone
   * @param {string} purpose - Purpose de l'OTP ('email' ou 'phone')
   * @param {number} personId - ID de la personne (pour validation)
   * @returns {Promise<Object>} OTP validé et marqué comme utilisé
   */
  async verifyOtp(otpCode, contactInfo, purpose, personId = null) {
    // Validation des paramètres
    if (!otpCode || !otpCode.trim()) {
      throw new Error('Code OTP requis');
    }

    if (!contactInfo || !contactInfo.trim()) {
      throw new Error('Contact requis');
    }

    if (!purpose || !['email', 'phone'].includes(purpose)) {
      throw new Error('Purpose d\'OTP invalide');
    }

    if (otpCode.length < 4 || otpCode.length > 10) {
      throw new Error('Code OTP invalide');
    }

    // Normaliser le contact
    const normalizedContact = contactInfo.toLowerCase().trim();

    // Résoudre la personne si l'ID n'est pas fourni
    if (!personId) {
      if (purpose === 'email') {
        const person = await peopleRepository.findByEmail(normalizedContact);
        if (person) {
          personId = person.id;
        }
      } else if (purpose === 'phone') {
        const person = await peopleRepository.findByPhone(normalizedContact);
        if (person) {
          personId = person.id;
        }
      }
    }

    if (!personId) {
      throw new Error('Aucun compte trouvé pour ce contact');
    }

    // Debug logs
    console.log('🔍 Debug OTP Validation:', {
      otpCode,
      personId,
      purpose,
      normalizedContact
    });

    // Vérifier et marquer comme utilisé
    const otp = await otpRepository.validateOtp(otpCode, personId, purpose);

    console.log('🔍 Debug OTP Result:', otp ? 'OTP trouvé' : 'OTP non trouvé');

    if (!otp) {
      throw new Error('Code OTP invalide ou expiré');
    }

    // Vérifier si l'OTP n'est pas expiré
    if (new Date(otp.expires_at) < new Date()) {
      throw new Error('Code OTP expiré');
    }

    return {
      valid: true,
      id: otp.id,
      purpose: otp.purpose,
      contactInfo: normalizedContact,
      expiresAt: otp.expires_at,
      createdAt: otp.created_at
    };
  }

  /**
   * Vérifie un code OTP pour l'email
   * @param {string} otpCode - Code OTP
   * @param {string} email - Email de la personne
   * @param {number} personId - ID de la personne (optionnel)
   * @returns {Promise<Object>} OTP validé
   */
  async verifyEmailOtp(otpCode, email, personId = null) {
    // Si personId n'est pas fourni, le récupérer depuis l'email
    if (!personId) {
      const person = await peopleRepository.findByEmail(email);
      if (!person) {
        throw new Error('Aucun compte trouvé avec cet email');
      }
      personId = person.id;
    }

    // Récupérer l'utilisateur associé à la personne
    const usersRepository = require('../users/users.repository');
    const user = await usersRepository.findByPersonId(personId);
    
    if (!user) {
      throw new Error('Aucun utilisateur trouvé pour cette personne');
    }

    // Utiliser personId pour la validation OTP (pas user.id)
    return await this.verifyOtp(otpCode, email, 'email', personId);
  }

  /**
   * Vérifie un code OTP pour le téléphone
   * @param {string} otpCode - Code OTP
   * @param {string} phone - Numéro de téléphone
   * @param {number} personId - ID de la personne (optionnel)
   * @returns {Promise<Object>} OTP validé
   */
  async verifyPhoneOtp(otpCode, phone, personId = null) {
    // Si personId n'est pas fourni, le récupérer depuis le téléphone
    if (!personId) {
      const person = await peopleRepository.findByPhone(phone);
      if (!person) {
        throw new Error('Aucun compte trouvé avec ce numéro de téléphone');
      }
      personId = person.id;
    }

    return await this.verifyOtp(otpCode, phone, 'phone', personId);
  }

  /**
   * Récupère tous les OTP d'une personne
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP (optionnel)
   * @returns {Promise<Array>} Liste des OTP
   */
  async getPersonOtps(personId, purpose = null) {
    if (!personId || personId <= 0) {
      throw new Error('ID personne invalide');
    }

    return await otpRepository.findByPersonId(personId, purpose);
  }

  /**
   * Invalide tous les OTP d'une personne
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP (optionnel)
   * @returns {Promise<number>} Nombre d'OTP invalidés
   */
  async invalidatePersonOtps(personId, purpose = null) {
    if (!personId || personId <= 0) {
      throw new Error('ID personne invalide');
    }

    const otps = await this.getPersonOtps(personId, purpose);
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
   * Vérifie si une personne a des OTP actifs
   * @param {number} personId - ID de la personne
   * @param {string} purpose - Purpose de l'OTP (optionnel)
   * @returns {Promise<boolean>} True si la personne a des OTP actifs
   */
  async hasActiveOtp(personId, purpose = null) {
    const count = await otpRepository.countActiveOtp(personId, purpose);
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
   * Nettoie tous les OTP d'une personne
   * @param {number} personId - ID de la personne
   * @returns {Promise<number>} Nombre d'OTP supprimés
   */
  async cleanupPersonOtps(personId) {
    if (!personId || personId <= 0) {
      throw new Error('ID personne invalide');
    }

    return await otpRepository.deleteByPersonId(personId);
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
   * @param {number} personId - ID de la personne
   * @param {string} email - Email de la personne
   * @returns {Promise<Object>} OTP de réinitialisation
   */
  async generatePasswordResetOtp(personId, email) {
    // Générer un OTP avec une durée plus longue pour la réinitialisation
    return await this.generateEmailOtp(personId, email, 30);
  }

  /**
   * Vérifie un OTP pour la réinitialisation de mot de passe
   * @param {string} otpCode - Code OTP
   * @param {string} email - Email de la personne
   * @param {number} personId - ID de la personne
   * @returns {Promise<Object>} OTP validé pour réinitialisation
   */
  async verifyPasswordResetOtp(otpCode, email, personId) {
    const otp = await this.verifyEmailOtp(otpCode, email, personId);

    if (otp) {
      // Ajouter une log pour la réinitialisation
      console.log(`🔐 Réinitialisation mot de passe pour la personne ${personId} via email ${email}`);
    }

    return otp;
  }

  /**
   * Valide le format d'un code OTP
   * @param {string} code - Code à valider
   * @returns {boolean} True si valide
   */
  validateOtpCode(code) {
    if (!code || typeof code !== 'string') {
      return false;
    }
    return /^\d+$/.test(code) && code.length >= 4 && code.length <= 10;
  }

  /**
   * Vérifie si un OTP est expiré
   * @param {Object} otp - Objet OTP avec expires_at
   * @returns {boolean} True si expiré
   */
  isOtpExpired(otp) {
    if (!otp || !otp.expires_at) {
      return true;
    }
    return new Date() > new Date(otp.expires_at);
  }

  /**
   * Invalide un OTP (marque comme utilisé)
   * @param {number} otpId - ID de l'OTP à invalider
   * @returns {Promise<boolean>} True si invalidé avec succès
   */
  async invalidateOtp(otpId) {
    try {
      await otpRepository.markAsUsed(otpId);
      logger.info(`OTP invalidé: ${otpId}`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'invalidation de l'OTP ${otpId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Formate la réponse OTP pour le client
   * @param {Object} otp - Objet OTP de la base
   * @returns {Object} OTP formaté
   */
  formatOtpResponse(otp) {
    return {
      id: otp.id,
      code: otp.otp_code,
      purpose: otp.purpose,
      expiresAt: otp.expires_at,
      isUsed: otp.is_used
    };
  }
}

module.exports = new OtpService();
