#!/usr/bin/env node

/**
 * Script de test de connexion manuel pour le super admin
 * Permet de tester la connexion et d'obtenir un token JWT valide
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const LOGIN_ENDPOINT = '/api/auth/login';

// Identifiants du super admin (développement)
const SUPER_ADMIN = {
  email: 'admin@eventplanner.com',
  password: 'Admin123!'
};

async function testLogin() {
  console.log('🔐 Test de connexion Super Admin');
  console.log('=====================================');
  console.log('📧 URL:', API_BASE_URL + LOGIN_ENDPOINT);
  console.log('📧 Email:', SUPER_ADMIN.email);
  console.log('🔑 Password:', SUPER_ADMIN.password);
  console.log('=====================================\n');

  try {
    console.log('📤 Envoi de la requête de connexion...');
    
    const response = await axios.post(API_BASE_URL + LOGIN_ENDPOINT, SUPER_ADMIN, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Réponse reçue - Status:', response.status);
    console.log('📋 Données:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data && response.data.data.token) {
      const token = response.data.data.token;
      
      console.log('\n🎉 CONNEXION RÉUSSIE !');
      console.log('=====================================');
      console.log('🔑 Token JWT:', token);
      console.log('📜 Token (premiers 50 chars):', token.substring(0, 50) + '...');
      console.log('=====================================\n');

      // Test de requête authentifiée
      console.log('🧪 Test d\'une requête protégée...');
      await testProtectedEndpoint(token);
      
    } else {
      console.log('\n❌ ÉCHEC DE LA CONNEXION');
      console.log('Message:', response.data.message || 'Erreur inconnue');
    }

  } catch (error) {
    console.error('\n💥 ERREUR LORS DE LA CONNEXION:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Données:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

async function testProtectedEndpoint(token) {
  try {
    const response = await axios.get(API_BASE_URL + '/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ Requête protégée réussie - Status:', response.status);
    console.log('📋 Données profil:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur lors du test de requête protégée:', error.message);
  }
}

// Commande curl équivalente
console.log('\n📋 Commande curl équivalente:');
console.log(`curl -X POST ${API_BASE_URL}${LOGIN_ENDPOINT} \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -d '${JSON.stringify(SUPER_ADMIN)}'`);
console.log('\n');

// Exécuter le test
testLogin().catch(console.error);
