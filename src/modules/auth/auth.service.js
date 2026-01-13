const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwtConfig = require('../../config/jwt');
const { hashPassword, verifyPassword } = require('../../utils/hash');
const { generateOTP, verifyOTP } = require('../../utils/otp');
const userRepository = require('../users/users.repository');
const peopleRepository = require('../people/people.repository');
const { connection } = require('../../config/database');

class AuthService {
  async register(userData) {
    const { firstName, lastName, email, username, password } = userData;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    // Créer la personne
    const person = await peopleRepository.create({
      firstName,
      lastName,
      email
    });

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const user = await userRepository.create({
      personId: person.id,
      username,
      email,
      passwordHash
    });

    // Générer le token de vérification email
    const verificationToken = uuidv4();
    await this.createEmailVerification(user.id, verificationToken);

    // TODO: Envoyer l'email de vérification

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      },
      verificationToken
    };
  }

  async login(credentials, ipAddress, userAgent) {
    const { email, password } = credentials;

    // Enregistrer la tentative de connexion
    await this.recordLoginAttempt(email, ipAddress, userAgent, false);

    // Trouver l'utilisateur
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new Error('Ce compte est désactivé');
    }

    // Mettre à jour la dernière connexion
    await userRepository.updateLastLogin(user.id);

    // Enregistrer la tentative réussie
    await this.recordLoginAttempt(email, ipAddress, userAgent, true);

    // Générer les tokens
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    const accessToken = jwtConfig.generateToken(payload);
    const refreshToken = jwtConfig.generateRefreshToken(payload);

    // Créer la session
    await this.createSession(user.id, refreshToken, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwtConfig.verifyToken(refreshToken);
      
      // Vérifier si la session existe et est active
      const session = await this.findSession(refreshToken);
      if (!session || !session.isActive) {
        throw new Error('Session invalide');
      }

      // Générer de nouveaux tokens
      const payload = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username
      };

      const newAccessToken = jwtConfig.generateToken(payload);
      const newRefreshToken = jwtConfig.generateRefreshToken(payload);

      // Mettre à jour la session
      await this.updateSession(refreshToken, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  async logout(userId, refreshToken) {
    await this.revokeSession(refreshToken);
  }

  async getProfile(userId) {
    const user = await userRepository.findByIdWithPerson(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Récupérer les rôles et permissions
    const roles = await userRepository.getUserRoles(userId);
    const permissions = await userRepository.getUserPermissions(userId);

    return {
      ...user,
      roles,
      permissions
    };
  }

  async updateProfile(userId, updateData) {
    const { firstName, lastName, phone, address, city, country, postalCode } = updateData;

    // Mettre à jour les informations de la personne
    await peopleRepository.update(userId, {
      firstName,
      lastName,
      phone,
      address,
      city,
      country,
      postalCode
    });

    return this.getProfile(userId);
  }

  async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const newPasswordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, newPasswordHash);

    // Révoquer toutes les sessions sauf la session actuelle
    // TODO: Implémenter la révocation des autres sessions
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Ne pas révéler si l'email existe ou pas
      return;
    }

    // Générer un token de réinitialisation
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure

    await this.createPasswordResetToken(user.id, resetToken, expiresAt);

    // TODO: Envoyer l'email de réinitialisation
  }

  async resetPassword(token, newPassword) {
    const resetToken = await this.findPasswordResetToken(token);
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new Error('Token de réinitialisation invalide ou expiré');
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await userRepository.updatePassword(resetToken.userId, passwordHash);

    // Marquer le token comme utilisé
    await this.markPasswordResetTokenAsUsed(token);

    // Révoquer toutes les sessions de l'utilisateur
    await this.revokeAllUserSessions(resetToken.userId);
  }

  async verifyEmail(token) {
    const verification = await this.findEmailVerification(token);
    if (!verification || verification.verified || verification.expiresAt < new Date()) {
      throw new Error('Token de vérification invalide ou expiré');
    }

    // Marquer l'email comme vérifié
    await userRepository.verifyEmail(verification.userId);

    // Marquer le token comme vérifié
    await this.markEmailAsVerified(token);
  }

  async resendVerification(email) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.isVerified) {
      return;
    }

    // Générer un nouveau token
    const verificationToken = uuidv4();
    await this.createEmailVerification(user.id, verificationToken);

    // TODO: Envoyer l'email de vérification
  }

  // Méthodes privées pour la gestion des sessions et tokens
  async createSession(userId, refreshToken, ipAddress, userAgent) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const query = `
      INSERT INTO sessions (id, user_id, refresh_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [sessionId, userId, refreshToken, expiresAt, ipAddress, userAgent]);
  }

  async findSession(refreshToken) {
    const query = 'SELECT * FROM sessions WHERE refresh_token = ? AND is_active = TRUE';
    const [rows] = await connection.execute(query, [refreshToken]);
    return rows[0] || null;
  }

  async updateSession(oldRefreshToken, newRefreshToken) {
    const query = `
      UPDATE sessions 
      SET refresh_token = ?, last_accessed = CURRENT_TIMESTAMP 
      WHERE refresh_token = ?
    `;
    await connection.execute(query, [newRefreshToken, oldRefreshToken]);
  }

  async revokeSession(refreshToken) {
    const query = 'UPDATE sessions SET is_active = FALSE WHERE refresh_token = ?';
    await connection.execute(query, [refreshToken]);
  }

  async revokeAllUserSessions(userId) {
    const query = 'UPDATE sessions SET is_active = FALSE WHERE user_id = ?';
    await connection.execute(query, [userId]);
  }

  async createEmailVerification(userId, token) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    const query = `
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    await connection.execute(query, [userId, token, expiresAt]);
  }

  async findEmailVerification(token) {
    const query = 'SELECT * FROM email_verifications WHERE token = ?';
    const [rows] = await connection.execute(query, [token]);
    return rows[0] || null;
  }

  async markEmailAsVerified(token) {
    const query = 'UPDATE email_verifications SET verified = TRUE WHERE token = ?';
    await connection.execute(query, [token]);
  }

  async createPasswordResetToken(userId, token, expiresAt) {
    const query = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    await connection.execute(query, [userId, token, expiresAt]);
  }

  async findPasswordResetToken(token) {
    const query = 'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE';
    const [rows] = await connection.execute(query, [token]);
    return rows[0] || null;
  }

  async markPasswordResetTokenAsUsed(token) {
    const query = 'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?';
    await connection.execute(query, [token]);
  }

  async recordLoginAttempt(email, ipAddress, userAgent, success, failureReason = null) {
    const query = `
      INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
      VALUES (?, ?, ?, ?, ?)
    `;
    await connection.execute(query, [email, ipAddress, userAgent, success, failureReason]);
  }
}

module.exports = new AuthService();
