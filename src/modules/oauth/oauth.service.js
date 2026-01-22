const { OAuth2Client } = require('google-auth-library');
const identitiesService = require('../identities/identities.service');
const authService = require('../auth/auth.service');
const sessionService = require('../sessions/sessions.service');
const { createResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Service OAuth pour Google Sign-In et Apple Sign-In
 * Gère la vérification des tokens et l'intégration avec le système existant
 */
class OAuthService {
  constructor() {
    // Client Google OAuth
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'postmessage' // Redirect URI pour les applications web
    );
  }

  /**
   * Vérifie un token Google ID et extrait les informations utilisateur
   * @param {string} idToken - Token ID Google
   * @returns {Promise<Object>} Informations utilisateur validées
   */
  async verifyGoogleToken(idToken) {
    try {
      if (!idToken || typeof idToken !== 'string') {
        throw new Error('Token Google invalide');
      }

      // Vérifier le token avec Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      // Validation des données requises
      if (!payload.email) {
        throw new Error('Email manquant dans le token Google');
      }

      if (!payload.sub) {
        throw new Error('ID utilisateur Google manquant');
      }

      // Vérifier que l'email est vérifié (Google le fait déjà)
      if (!payload.email_verified) {
        throw new Error('Email Google non vérifié');
      }

      // Extraire et normaliser les données
      const userData = {
        provider: 'google',
        provider_user_id: payload.sub,
        email: payload.email.toLowerCase().trim(),
        first_name: payload.given_name || null,
        last_name: payload.family_name || null,
        picture: payload.picture || null,
        locale: payload.locale || null,
        provider_data: {
          iss: payload.iss,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          name: payload.name,
          picture: payload.picture,
          locale: payload.locale
        }
      };

      logger.auth('Google token verified successfully', {
        email: userData.email,
        provider_user_id: userData.provider_user_id
      });

      return userData;

    } catch (error) {
      logger.error('Google token verification failed', {
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('invalid_token')) {
        throw new Error('Token Google invalide ou expiré');
      }

      throw new Error(`Erreur vérification token Google: ${error.message}`);
    }
  }

  /**
   * Vérifie un token Apple Sign-In et extrait les informations utilisateur
   * @param {Object} appleData - Données Apple Sign-In
   * @returns {Promise<Object>} Informations utilisateur validées
   */
  async verifyAppleToken(appleData) {
    try {
      const { identityToken, user: appleUserId } = appleData;

      if (!identityToken) {
        throw new Error('Token d\'identité Apple manquant');
      }

      // Pour Apple, nous devons vérifier le token JWT manuellement
      // Apple fournit les clés publiques via un endpoint JWKS
      const jwt = require('jsonwebtoken');
      const axios = require('axios');

      // Décoder le token sans vérification pour obtenir le kid
      const decodedHeader = jwt.decode(identityToken, { complete: true });
      if (!decodedHeader || !decodedHeader.header) {
        throw new Error('Token Apple mal formaté');
      }

      const keyId = decodedHeader.header.kid;
      if (!keyId) {
        throw new Error('Key ID manquant dans le token Apple');
      }

      // Récupérer les clés publiques Apple
      const jwksResponse = await axios.get('https://appleid.apple.com/auth/keys');
      const jwks = jwksResponse.data;

      // Trouver la clé correspondante
      const signingKey = jwks.keys.find(key => key.kid === keyId);
      if (!signingKey) {
        throw new Error('Clé de signature Apple non trouvée');
      }

      // Convertir la clé pour verification
      const publicKey = this.getApplePublicKey(signingKey);

      // Vérifier le token
      const payload = jwt.verify(identityToken, publicKey, {
        algorithms: ['RS256'],
        audience: process.env.APPLE_CLIENT_ID,
        issuer: 'https://appleid.apple.com'
      });

      // Validation des données requises
      if (!payload.sub) {
        throw new Error('ID utilisateur Apple manquant');
      }

      // Pour Apple, l'email peut être null si l'utilisateur a masqué son email
      const email = payload.email || `${payload.sub}@privaterelay.appleid.com`;

      // Extraire et normaliser les données
      const userData = {
        provider: 'apple',
        provider_user_id: payload.sub,
        email: email.toLowerCase().trim(),
        first_name: null, // Apple ne fournit pas le prénom dans le token
        last_name: null,  // Apple ne fournit pas le nom dans le token
        email_verified: payload.email_verified || false,
        is_private_email: payload.email?.includes('@privaterelay.appleid.com') || false,
        provider_data: {
          iss: payload.iss,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          email_verified: payload.email_verified,
          is_private_email: payload.email?.includes('@privaterelay.appleid.com') || false,
          original_apple_user_id: appleUserId // Si fourni par le client
        }
      };

      logger.auth('Apple token verified successfully', {
        email: userData.email,
        provider_user_id: userData.provider_user_id,
        is_private_email: userData.is_private_email
      });

      return userData;

    } catch (error) {
      logger.error('Apple token verification failed', {
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('jwt')) {
        throw new Error('Token Apple invalide ou expiré');
      }

      throw new Error(`Erreur vérification token Apple: ${error.message}`);
    }
  }

  /**
   * Convertit une clé Apple JWKS en format utilisable par jsonwebtoken
   * @param {Object} jwkKey - Clé au format JWKS
   * @returns {string} Clé publique au format PEM
   */
  getApplePublicKey(jwkKey) {
    // Pour simplifier, nous allons utiliser une approche plus directe
    // Apple utilise RS256 avec les clés publiques au format JWK
    const NodeRSA = require('node-rsa');
    
    // Créer une clé RSA à partir des composants JWK
    const rsa = new NodeRSA();
    const keyData = {
      n: Buffer.from(jwkKey.n, 'base64url'),
      e: Buffer.from(jwkKey.e, 'base64url')
    };
    
    rsa.importKey({
      n: keyData.n,
      e: keyData.e
    }, 'components-public');
    
    return rsa.exportKey('public');
  }

  /**
   * Authentifie un utilisateur via OAuth (Google ou Apple)
   * @param {string} provider - Fournisseur ('google' ou 'apple')
   * @param {string|Object} tokenData - Token ou données OAuth
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultat de l'authentification
   */
  async authenticateWithOAuth(provider, tokenData, options = {}) {
    try {
      // Valider le token selon le fournisseur
      let userData;
      if (provider === 'google') {
        userData = await this.verifyGoogleToken(tokenData);
      } else if (provider === 'apple') {
        userData = await this.verifyAppleToken(tokenData);
      } else {
        throw new Error('Fournisseur OAuth non supporté');
      }

      // Authentifier via le service des identités
      const authResult = await identitiesService.authenticateWithOAuth(userData);

      // Générer le token JWT interne
      const token = authService.generateToken(authResult.user);

      // Créer la session
      let sessionData = null;
      try {
        const sessionResult = await sessionService.createSession({
          accessToken: token,
          userId: authResult.user.id,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          expiresIn: 24 * 60 * 60 // 24 heures
        });
        
        if (sessionResult.success) {
          sessionData = sessionResult.session;
        }
      } catch (sessionError) {
        logger.warn('Failed to create OAuth session', {
          error: sessionError.message,
          userId: authResult.user.id,
          provider
        });
        // Continuer même si la session échoue
      }

      // Préparer la réponse
      const responseData = {
        user: authResult.user,
        token: token,
        provider: provider,
        isNewUser: authResult.isNewUser,
        identity: authResult.identity
      };

      // Ajouter les tokens de session si disponibles
      if (sessionData && sessionData.tokens) {
        responseData.tokens = sessionData.tokens;
      }

      logger.auth('OAuth authentication successful', {
        userId: authResult.user.id,
        email: authResult.user.email,
        provider,
        isNewUser: authResult.isNewUser
      });

      return {
        success: true,
        message: authResult.isNewUser 
          ? `Compte créé avec ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
          : `Connexion ${provider.charAt(0).toUpperCase() + provider.slice(1)} réussie`,
        data: responseData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('OAuth authentication failed', {
        error: error.message,
        provider,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Lie un compte OAuth à un utilisateur existant
   * @param {number} userId - ID utilisateur existant
   * @param {string} provider - Fournisseur OAuth
   * @param {string|Object} tokenData - Token ou données OAuth
   * @returns {Promise<Object>} Résultat de liaison
   */
  async linkOAuthToUser(userId, provider, tokenData) {
    try {
      // Valider le token selon le fournisseur
      let userData;
      if (provider === 'google') {
        userData = await this.verifyGoogleToken(tokenData);
      } else if (provider === 'apple') {
        userData = await this.verifyAppleToken(tokenData);
      } else {
        throw new Error('Fournisseur OAuth non supporté');
      }

      // Lier l'identité à l'utilisateur
      const identity = await identitiesService.linkIdentityToUser(userData, userId);

      logger.auth('OAuth identity linked successfully', {
        userId,
        provider,
        provider_user_id: userData.provider_user_id
      });

      return {
        success: true,
        message: `Compte ${provider.charAt(0).toUpperCase() + provider.slice(1)} lié avec succès`,
        data: {
          identity,
          provider
        }
      };

    } catch (error) {
      logger.error('OAuth identity linking failed', {
        error: error.message,
        userId,
        provider
      });

      throw error;
    }
  }

  /**
   * Vérifie la configuration OAuth
   * @returns {Object} État de la configuration
   */
  checkConfiguration() {
    const config = {
      google: {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      },
      apple: {
        clientId: !!process.env.APPLE_CLIENT_ID,
        teamId: !!process.env.APPLE_TEAM_ID,
        keyId: !!process.env.APPLE_KEY_ID,
        privateKey: !!process.env.APPLE_PRIVATE_KEY,
        configured: !!(
          process.env.APPLE_CLIENT_ID &&
          process.env.APPLE_TEAM_ID &&
          process.env.APPLE_KEY_ID &&
          process.env.APPLE_PRIVATE_KEY
        )
      }
    };

    return config;
  }
}

module.exports = new OAuthService();
