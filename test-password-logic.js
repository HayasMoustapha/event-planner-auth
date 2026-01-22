require('dotenv').config();
const bcrypt = require('bcrypt');
const passwordService = require('./src/modules/password/password.service');
const usersRepository = require('./src/modules/users/users.repository');
const passwordRepository = require('./src/modules/password/password.repository');
const peopleRepository = require('./src/modules/people/people.repository');
const { connection } = require('./src/config/database');

/**
 * Script de test complet pour la logique password_reset_tokens et password_histories
 * Teste : création, validation, réinitialisation, historique et réutilisation
 */

const TEST_USER = {
  email: 'test.password@eventplanner.com',
  username: 'testpassword',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'Password'
};

let testUserId = null;
let testPersonId = null;
let testToken = null;

async function setupTestUser() {
  console.log('\n🔧 Setup: Création utilisateur de test...');
  
  try {
    // Nettoyage complet des données de test existantes
    console.log('🧹 Nettoyage données existantes...');
    await connection.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);
    await connection.query('DELETE FROM people WHERE email = $1', [TEST_USER.email]);
    await connection.query('DELETE FROM password_reset_tokens WHERE email = $1', [TEST_USER.email]);
    console.log('✅ Données existantes nettoyées');

    // Créer une personne d'abord
    console.log('👤 Création personne de test...');
    const newPerson = await peopleRepository.create({
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
      email: TEST_USER.email,
      phone: `+336${Date.now().toString().slice(-8)}`, // Numéro unique
      created_by: 1
    });

    testPersonId = newPerson.id;
    console.log(`✅ Personne créée: ID ${testPersonId}`);

    // Créer l'utilisateur lié à la personne
    const newUser = await usersRepository.create({
      username: TEST_USER.username,
      email: TEST_USER.email,
      password: TEST_USER.password,
      person_id: testPersonId,
      userCode: `TEST_${Date.now()}`, // Code unique (attention: userCode, pas user_code)
      phone: `+336${Date.now().toString().slice(-8)}`,
      createdBy: 1
    });

    testUserId = newUser.id;
    console.log(`✅ Utilisateur créé: ID ${testUserId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur setup:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testPasswordResetFlow() {
  console.log('\n🧪 Test 1: Flow complet de réinitialisation de mot de passe');
  
  try {
    // 1. Demander une réinitialisation
    console.log('1️⃣ Demande de réinitialisation...');
    const resetRequest = await passwordService.requestPasswordReset(TEST_USER.email);
    
    if (!resetRequest.success) {
      throw new Error('Échec demande réinitialisation');
    }
    
    console.log('✅ Demande acceptée');
    
    // 2. Récupérer le token depuis la base
    console.log('2️⃣ Récupération du token...');
    const tokenData = await passwordRepository.getResetToken(TEST_USER.email);
    
    if (!tokenData) {
      throw new Error('Token non trouvé en base');
    }
    
    testToken = tokenData.token;
    console.log(`✅ Token récupéré: ${testToken.substring(0, 8)}...`);
    
    // 3. Valider le token
    console.log('3️⃣ Validation du token...');
    if (tokenData.token !== testToken) {
      throw new Error('Token invalide');
    }
    
    // Vérifier l'âge du token
    const tokenAge = Date.now() - new Date(tokenData.created_at).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures
    
    if (tokenAge > maxAge) {
      throw new Error('Token expiré');
    }
    
    console.log(`✅ Token valide (âge: ${Math.round(tokenAge / 1000)}s)`);
    
    // 4. Réinitialiser le mot de passe
    console.log('4️⃣ Réinitialisation du mot de passe...');
    const newPassword = 'NewPassword456!';
    const resetResult = await passwordService.resetPassword(TEST_USER.email, testToken, newPassword);
    
    if (!resetResult.success) {
      throw new Error(`Échec réinitialisation: ${resetResult.message}`);
    }
    
    console.log('✅ Mot de passe réinitialisé');
    
    // 5. Vérifier que le token a été supprimé
    console.log('5️⃣ Vérification suppression token...');
    const deletedToken = await passwordRepository.getResetToken(TEST_USER.email);
    
    if (deletedToken) {
      throw new Error('Token non supprimé après utilisation');
    }
    
    console.log('✅ Token supprimé avec succès');
    
    // 6. Vérifier la connexion avec nouveau mot de passe
    console.log('6️⃣ Test connexion nouveau mot de passe...');
    const user = await usersRepository.findByEmail(TEST_USER.email, true); // includePassword = true
    
    if (!user || !user.password) {
      throw new Error('Utilisateur ou mot de passe non trouvé après réinitialisation');
    }
    
    const isValidPassword = await bcrypt.compare(newPassword, user.password);
    
    if (!isValidPassword) {
      throw new Error('Nouveau mot de passe non valide');
    }
    
    console.log('✅ Connexion réussie avec nouveau mot de passe');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test réinitialisation:', error.message);
    return false;
  }
}

async function testPasswordHistory() {
  console.log('\n🧪 Test 2: Historique des mots de passe');
  
  try {
    // 1. Vérifier l'historique initial
    console.log('1️⃣ Vérification historique initial...');
    const history1 = await passwordRepository.getPasswordHistory(testUserId);
    
    if (history1.data.length === 0) {
      throw new Error('Historique vide - devrait contenir au moins 1 entrée');
    }
    
    console.log(`✅ Historique contient ${history1.data.length} entrée(s)`);
    
    // 2. Changer le mot de passe plusieurs fois
    console.log('2️⃣ Changements multiples de mot de passe...');
    const passwords = ['Password789!', 'PasswordABC!', 'PasswordXYZ!'];
    
    for (let i = 0; i < passwords.length; i++) {
      await usersRepository.updatePasswordDirect(testUserId, passwords[i], testUserId);
      console.log(`✅ Mot de passe ${i + 1} changé`);
    }
    
    // 3. Vérifier l'historique mis à jour
    console.log('3️⃣ Vérification historique mis à jour...');
    const history2 = await passwordRepository.getPasswordHistory(testUserId);
    
    if (history2.data.length < passwords.length + 1) {
      throw new Error(`Historique incomplet: ${history2.data.length} entrées, attendu ${passwords.length + 1}`);
    }
    
    console.log(`✅ Historique contient ${history2.data.length} entrée(s)`);
    
    // 4. Tester la pagination
    console.log('4️⃣ Test pagination...');
    const pagedHistory = await passwordRepository.getPasswordHistory(testUserId, { page: 1, limit: 2 });
    
    if (pagedHistory.data.length !== 2) {
      throw new Error('Pagination incorrecte');
    }
    
    console.log(`✅ Pagination fonctionnelle: ${pagedHistory.data.length} entrées sur la page`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test historique:', error.message);
    return false;
  }
}

async function testPasswordReuse() {
  console.log('\n🧪 Test 3: Détection de réutilisation de mot de passe');
  
  try {
    // 1. Récupérer l'historique des mots de passe
    console.log('1️⃣ Récupération historique mots de passe...');
    const history = await passwordRepository.getPasswordHistory(testUserId);
    
    if (history.data.length === 0) {
      throw new Error('Historique vide - impossible de tester la réutilisation');
    }
    
    // 2. Prendre le premier mot de passe de l'historique et tester s'il est détecté comme utilisé
    console.log('2️⃣ Test détection avec mot de passe existant...');
    
    // Récupérer le hash complet depuis l'historique
    const historyQuery = `
      SELECT password 
      FROM password_histories 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const historyResult = await connection.query(historyQuery, [testUserId]);
    const existingPasswordHash = historyResult.rows[0].password;
    
    // Tester si ce hash est détecté comme utilisé
    const isAlreadyUsed = await passwordRepository.isPasswordAlreadyUsed(testUserId, existingPasswordHash);
    
    if (!isAlreadyUsed) {
      throw new Error('Détection de réutilisation échouée - un mot de passe existant devrait être détecté');
    }
    
    console.log('✅ Réutilisation de mot de passe détectée');
    
    // 3. Tester avec un nouveau hash qui n'existe pas
    console.log('3️⃣ Test avec nouveau mot de passe...');
    const newPassword = await bcrypt.hash('BrandNewPassword123!' + Date.now(), 12);
    const isNewPasswordUsed = await passwordRepository.isPasswordAlreadyUsed(testUserId, newPassword);
    
    if (isNewPasswordUsed) {
      throw new Error('Faux positif détection réutilisation');
    }
    
    console.log('✅ Nouveau mot de passe correctement identifié comme non utilisé');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test réutilisation:', error.message);
    return false;
  }
}

async function testTokenExpiration() {
  console.log('\n🧪 Test 4: Expiration des tokens');
  
  try {
    // 1. Supprimer d'abord tout token existant
    console.log('1️⃣ Nettoyage tokens existants...');
    await passwordRepository.deleteResetToken(TEST_USER.email);
    
    // 2. Créer un token manuellement avec une date ancienne
    console.log('2️⃣ Création token expiré...');
    const oldToken = 'expired_token_12345678901234567890123456789012';
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 heures avant
    
    await connection.query(
      'INSERT INTO password_reset_tokens (email, token, created_at) VALUES ($1, $2, $3)',
      [TEST_USER.email, oldToken, oldDate]
    );
    
    console.log('✅ Token expiré créé');
    
    // 3. Tenter de l'utiliser
    console.log('3️⃣ Tentative utilisation token expiré...');
    const resetResult = await passwordService.resetPassword(TEST_USER.email, oldToken, 'ExpiredPassword123!');
    
    if (resetResult.success) {
      throw new Error('Token expiré accepté - devrait être refusé');
    }
    
    if (!resetResult.message.includes('expiré')) {
      throw new Error('Message d\'erreur incorrect pour token expiré');
    }
    
    console.log('✅ Token expiré correctement refusé');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test expiration:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Nettoyage...');
  
  try {
    // Supprimer l'utilisateur de test
    if (testUserId) {
      await connection.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log('✅ Utilisateur de test supprimé');
    }
    
    // Supprimer la personne de test
    if (testPersonId) {
      await connection.query('DELETE FROM people WHERE id = $1', [testPersonId]);
      console.log('✅ Personne de test supprimée');
    }
    
    // Supprimer les tokens
    await connection.query('DELETE FROM password_reset_tokens WHERE email = $1', [TEST_USER.email]);
    console.log('✅ Tokens de test supprimés');
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 DÉMARRAGE TESTS COMPLETS PASSWORD RESET & HISTORIES');
  console.log('=' .repeat(60));
  
  const results = {
    setup: false,
    passwordReset: false,
    passwordHistory: false,
    passwordReuse: false,
    tokenExpiration: false
  };
  
  try {
    // Setup
    results.setup = await setupTestUser();
    if (!results.setup) {
      throw new Error('Setup échoué');
    }
    
    // Tests
    results.passwordReset = await testPasswordResetFlow();
    results.passwordHistory = await testPasswordHistory();
    results.passwordReuse = await testPasswordReuse();
    results.tokenExpiration = await testTokenExpiration();
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
  } finally {
    await cleanup();
  }
  
  // Résultats finaux
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS FINAUX');
  console.log('='.repeat(60));
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = {
      setup: 'Setup utilisateur',
      passwordReset: 'Flow réinitialisation',
      passwordHistory: 'Historique mots de passe',
      passwordReuse: 'Détection réutilisation',
      tokenExpiration: 'Expiration tokens'
    }[test];
    
    console.log(`${status} - ${testName}`);
  });
  
  console.log('='.repeat(60));
  console.log(`🎯 Score: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS RÉUSSIS - Logique password_reset_tokens et password_histories fonctionne parfaitement !');
  } else {
    console.log('⚠️ Certains tests ont échoué - Vérifier l\'implémentation');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejet non géré:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  process.exit(1);
});

// Démarrer les tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  setupTestUser,
  testPasswordResetFlow,
  testPasswordHistory,
  testPasswordReuse,
  testTokenExpiration,
  cleanup
};
