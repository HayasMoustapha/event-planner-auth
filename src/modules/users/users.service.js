const bcrypt = require('bcrypt');
const { hashPassword } = require('../../utils/hash');
const usersRepository = require('./users.repository');
const peopleRepository = require('../people/people.repository');

class UsersService {
  async getAll(options = {}) {
    const { page, limit, search, status } = options;
    return await usersRepository.findAll({ page, limit, search, status });
  }

  async getById(id) {
    const user = await usersRepository.findByIdWithPerson(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Récupérer les rôles et permissions
    const roles = await usersRepository.getUserRoles(id);
    const permissions = await usersRepository.getUserPermissions(id);

    return {
      ...user,
      roles,
      permissions
    };
  }

  async create(userData, createdBy) {
    const { personId, username, email, password, roleIds = [] } = userData;

    // Vérifier si la personne existe
    const person = await peopleRepository.findById(personId);
    if (!person) {
      throw new Error('Personne non trouvée');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await usersRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const existingUsername = await usersRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const user = await usersRepository.create({
      personId,
      username,
      email,
      passwordHash,
      createdBy
    });

    // Assigner les rôles
    if (roleIds.length > 0) {
      await usersRepository.assignRoles(user.id, roleIds, createdBy);
    }

    return this.getById(user.id);
  }

  async update(id, updateData) {
    // Vérifier si l'utilisateur existe
    const existingUser = await usersRepository.findById(id);
    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Si l'email est modifié, vérifier s'il n'existe pas déjà
    if (updateData.email && updateData.email !== existingUser.email) {
      const existingEmail = await usersRepository.findByEmail(updateData.email);
      if (existingEmail) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }
    }

    // Si le username est modifié, vérifier s'il n'existe pas déjà
    if (updateData.username && updateData.username !== existingUser.username) {
      const existingUsername = await usersRepository.findByUsername(updateData.username);
      if (existingUsername) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
    }

    // Si le mot de passe est fourni, le hasher
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }

    await usersRepository.update(id, updateData);
    return this.getById(id);
  }

  async delete(id) {
    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Empêcher la suppression du dernier super admin
    const superAdminRoles = await usersRepository.getUserRoles(id);
    const isSuperAdmin = superAdminRoles.some(role => role.name === 'super_admin');
    
    if (isSuperAdmin) {
      const superAdminCount = await usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new Error('Impossible de supprimer le dernier super administrateur');
      }
    }

    await usersRepository.delete(id);
  }

  async getUserRoles(userId) {
    return await usersRepository.getUserRoles(userId);
  }

  async assignRole(userId, roleId, assignedBy) {
    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si le rôle existe
    const role = await usersRepository.findRoleById(roleId);
    if (!role) {
      throw new Error('Rôle non trouvé');
    }

    // Vérifier si le rôle est déjà assigné
    const existingAssignment = await usersRepository.hasRole(userId, roleId);
    if (existingAssignment) {
      throw new Error('Ce rôle est déjà assigné à l\'utilisateur');
    }

    await usersRepository.assignRole(userId, roleId, assignedBy);
  }

  async removeRole(userId, roleId) {
    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si le rôle est assigné
    const existingAssignment = await usersRepository.hasRole(userId, roleId);
    if (!existingAssignment) {
      throw new Error('Ce rôle n\'est pas assigné à l\'utilisateur');
    }

    // Empêcher le retrait du dernier super admin
    const role = await usersRepository.findRoleById(roleId);
    if (role.name === 'super_admin') {
      const superAdminCount = await usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new Error('Impossible de retirer le rôle super admin du dernier administrateur');
      }
    }

    await usersRepository.removeRole(userId, roleId);
  }

  async updateStatus(userId, statusData) {
    const { isActive, isVerified } = statusData;

    // Vérifier si l'utilisateur existe
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    await usersRepository.update(userId, updateData);
    return this.getById(userId);
  }
}

module.exports = new UsersService();
