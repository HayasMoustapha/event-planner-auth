#!/usr/bin/env node

/**
 * Test de sécurité des mots de passe
 * Valide que bcrypt génère des hashes uniques
 */

const bcrypt = require('bcrypt');

async function testPasswordSecurity() {
  console.log('🔍 Test de sécurité des mots de passe...\n');
  
  const testPassword = 'TestPassword123!';
  
  try {
    // Test 1: Unicité des hashes
    console.log('📋 Test 1: Unicité des hashes');
    const hash1 = await bcrypt.hash(testPassword, 12);
    const hash2 = await bcrypt.hash(testPassword, 12);
    const hash3 = await bcrypt.hash(testPassword, 12);
    
    console.log(`Hash 1: ${hash1.substring(0, 25)}...`);
    console.log(`Hash 2: ${hash2.substring(0, 25)}...`);
    console.log(`Hash 3: ${hash3.substring(0, 25)}...`);
    
    const hashesAreUnique = hash1 !== hash2 && hash2 !== hash3 && hash1 !== hash3;
    console.log(`✅ Hashs uniques: ${hashesAreUnique ? 'OUI' : 'NON'}`);
    
    if (!hashesAreUnique) {
      throw new Error('❌ Les hashes ne sont pas uniques!');
    }
    
    console.log('\n📋 Test 2: Vérification correcte');
    const isValid1 = await bcrypt.compare(testPassword, hash1);
    const isValid2 = await bcrypt.compare(testPassword, hash2);
    const isValid3 = await bcrypt.compare(testPassword, hash3);
    const isInvalid = await bcrypt.compare('WrongPassword', hash1);
    
    console.log(`✅ Hash 1 vérifie: ${isValid1 ? 'OUI' : 'NON'}`);
    console.log(`✅ Hash 2 vérifie: ${isValid2 ? 'OUI' : 'NON'}`);
    console.log(`✅ Hash 3 vérifie: ${isValid3 ? 'OUI' : 'NON'}`);
    console.log(`✅ Mot de passe incorrect rejeté: ${!isInvalid ? 'OUI' : 'NON'}`);
    
    if (!isValid1 || !isValid2 || !isValid3 || isInvalid) {
      throw new Error('❌ La vérification des mots de passe échoue!');
    }
    
    console.log('\n📋 Test 3: Structure des hashes');
    const hashPattern = /^\$2[ab]\$12\$/;
    const hash1Valid = hashPattern.test(hash1);
    const hash2Valid = hashPattern.test(hash2);
    const hash3Valid = hashPattern.test(hash3);
    
    console.log(`✅ Format hash 1 correct: ${hash1Valid ? 'OUI' : 'NON'}`);
    console.log(`✅ Format hash 2 correct: ${hash2Valid ? 'OUI' : 'NON'}`);
    console.log(`✅ Format hash 3 correct: ${hash3Valid ? 'OUI' : 'NON'}`);
    
    if (!hash1Valid || !hash2Valid || !hash3Valid) {
      throw new Error('❌ Le format des hashes est incorrect!');
    }
    
    console.log('\n🎉 TOUS LES TESTS DE SÉCURITÉ SONT PASSÉS!');
    console.log('✅ L\'implémentation bcrypt est cryptographiquement correcte');
    console.log('✅ Chaque utilisateur aura un hash unique');
    console.log('✅ La vérification des mots de passe fonctionne correctement');
    
  } catch (error) {
    console.error('❌ Test de sécurité échoué:', error.message);
    process.exit(1);
  }
}

// Exécuter le test
testPasswordSecurity();
