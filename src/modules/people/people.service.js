const peopleRepository = require('./people.repository');
const { validateEmail, validatePhone } = require('../../utils/validators');

/**
 * Service métier pour la gestion des personnes
 * Contient la logique business, validation et gestion des erreurs
 */
class PeopleService {
  /**
   * Récupère toutes les personnes avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} Données paginées
   */
  async getAll(options = {}) {
    const { page = 1, limit = 10, search, status } = options;
    
    // Validation des paramètres
    if (page < 1) throw new Error('Le numéro de page doit être supérieur à 0');
    if (limit < 1 || limit > 100) throw new Error('La limite doit être entre 1 et 100');
    
    return await peopleRepository.findAll({ page, limit, search, status });
  }

  /**
   * Récupère une personne par son ID
   * @param {number} id - ID de la personne
   * @returns {Promise<Object>} Données de la personne
   */
  async getById(id) {
    if (!id || id <= 0) {
      throw new Error('ID de personne invalide');
    }

    const person = await peopleRepository.findById(id);
    if (!person) {
      throw new Error('Personne non trouvée');
    }
    
    return person;
  }

  /**
   * Récupère une personne par son email
   * @param {string} email - Email de la personne
   * @returns {Promise<Object>} Données de la personne
   */
  async getByEmail(email) {
    if (!email) {
      throw new Error('Email requis');
    }

    if (!validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }

    const person = await peopleRepository.findByEmail(email);
    if (!person) {
      throw new Error('Personne non trouvée avec cet email');
    }
    
    return person;
  }

  /**
   * Récupère une personne par son téléphone
   * @param {string} phone - Téléphone de la personne
   * @returns {Promise<Object>} Données de la personne
   */
  async getByPhone(phone) {
    if (!phone) {
      throw new Error('Téléphone requis');
    }

    if (!validatePhone(phone)) {
      throw new Error('Format de téléphone invalide');
    }

    const person = await peopleRepository.findByPhone(phone);
    if (!person) {
      throw new Error('Personne non trouvée avec ce téléphone');
    }
    
    return person;
  }

  /**
   * Crée une nouvelle personne avec validation complète
   * @param {Object} personData - Données de la personne
   * @param {number} createdBy - ID de l'utilisateur qui crée
   * @returns {Promise<Object>} Personne créée
   */
  async create(personData, createdBy = null) {
    const {
      firstName,
      lastName,
      email,
      phone,
      photo,
      status = 'active'
    } = personData;

    // Validation des champs obligatoires
    if (!firstName || !firstName.trim()) {
      throw new Error('Le prénom est obligatoire');
    }
    if (!lastName || !lastName.trim()) {
      throw new Error('Le nom de famille est obligatoire');
    }
    if (!email) {
      throw new Error('L\'email est obligatoire');
    }

    // Validation des formats
    if (!validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }
    if (phone && !validatePhone(phone)) {
      throw new Error('Format de téléphone invalide');
    }

    // Validation du statut
    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive');
    }

    // Nettoyage des données
    const cleanData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      photo: photo ? photo.trim() : null,
      status,
      createdBy
    };

    // Vérification des doublons
    const existingPerson = await peopleRepository.findByEmail(cleanData.email);
    if (existingPerson) {
      throw new Error('Une personne avec cet email existe déjà');
    }

    if (cleanData.phone) {
      const existingPhone = await peopleRepository.findByPhone(cleanData.phone);
      if (existingPhone) {
        throw new Error('Une personne avec ce numéro de téléphone existe déjà');
      }
    }

    return await peopleRepository.create(cleanData);
  }

  /**
   * Met à jour une personne avec validation
   * @param {number} id - ID de la personne
   * @param {Object} updateData - Données à mettre à jour
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Personne mise à jour
   */
  async update(id, updateData, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de personne invalide');
    }

    // Vérifier si la personne existe
    const existingPerson = await peopleRepository.findById(id);
    if (!existingPerson) {
      throw new Error('Personne non trouvée');
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      photo,
      status
    } = updateData;

    // Validation des formats si fournis
    if (email && !validateEmail(email)) {
      throw new Error('Format d\'email invalide');
    }
    if (phone && !validatePhone(phone)) {
      throw new Error('Format de téléphone invalide');
    }
    if (status && !['active', 'inactive'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive');
    }

    // Nettoyage des données
    const cleanData = {};
    if (firstName !== undefined) cleanData.firstName = firstName.trim();
    if (lastName !== undefined) cleanData.lastName = lastName.trim();
    if (email !== undefined) cleanData.email = email.toLowerCase().trim();
    if (phone !== undefined) cleanData.phone = phone ? phone.trim() : null;
    if (photo !== undefined) cleanData.photo = photo ? photo.trim() : null;
    if (status !== undefined) cleanData.status = status;
    cleanData.updatedBy = updatedBy;

    // Vérification des doublons si email/téléphone modifié
    if (cleanData.email && cleanData.email !== existingPerson.email) {
      const existingEmail = await peopleRepository.findByEmail(cleanData.email);
      if (existingEmail) {
        throw new Error('Une personne avec cet email existe déjà');
      }
    }

    if (cleanData.phone !== undefined && cleanData.phone !== existingPerson.phone) {
      if (cleanData.phone) {
        const existingPhone = await peopleRepository.findByPhone(cleanData.phone);
        if (existingPhone) {
          throw new Error('Une personne avec ce numéro de téléphone existe déjà');
        }
      }
    }

    return await peopleRepository.update(id, cleanData);
  }

  /**
   * Supprime logiquement une personne
   * @param {number} id - ID de la personne
   * @param {number} deletedBy - ID de l'utilisateur qui supprime
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async delete(id, deletedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de personne invalide');
    }

    // Vérifier si la personne existe
    const person = await peopleRepository.findById(id);
    if (!person) {
      throw new Error('Personne non trouvée');
    }

    // Vérifier si la personne est associée à des utilisateurs
    const hasUsers = await peopleRepository.hasAssociatedUser(id);
    if (hasUsers) {
      throw new Error('Impossible de supprimer cette personne car elle est associée à des utilisateurs');
    }

    return await peopleRepository.softDelete(id, deletedBy);
  }

  /**
   * Active ou désactive une personne
   * @param {number} id - ID de la personne
   * @param {string} status - Nouveau statut (active/inactive)
   * @param {number} updatedBy - ID de l'utilisateur qui modifie
   * @returns {Promise<Object>} Personne mise à jour
   */
  async updateStatus(id, status, updatedBy = null) {
    if (!id || id <= 0) {
      throw new Error('ID de personne invalide');
    }

    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Statut invalide. Valeurs autorisées: active, inactive');
    }

    return await peopleRepository.updateStatus(id, status, updatedBy);
  }

  /**
   * Recherche des personnes par critères multiples
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Object>} Résultats paginés
   */
  async search(criteria) {
    const { search, status, page = 1, limit = 10 } = criteria;
    
    return await this.getAll({
      search: search?.trim(),
      status,
      page,
      limit
    });
  }

  /**
   * Vérifie si une personne existe (pour validation externe)
   * @param {number} id - ID de la personne
   * @returns {Promise<boolean>} True si la personne existe
   */
  async exists(id) {
    if (!id || id <= 0) return false;
    
    try {
      const person = await peopleRepository.findById(id);
      return !!person;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère les statistiques sur les personnes
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    try {
      const active = await peopleRepository.findAll({ status: 'active', limit: 1 });
      const inactive = await peopleRepository.findAll({ status: 'inactive', limit: 1 });
      const all = await peopleRepository.findAll({ limit: 1 });

      return {
        total: all.pagination.total,
        active: active.pagination.total,
        inactive: inactive.pagination.total
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
}

module.exports = new PeopleService();
