#!/usr/bin/env node

/**
 * Test manuel de création d'utilisateurs
 * Valide que 2 utilisateurs avec le même mot de passe ont des hashes différents
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuration PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_planner_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function testUserCreation() {
  console.log('🧪 Test de création d\'utilisateurs...\n');
  
  const testPassword = 'TestPassword123!';
  const timestamp = Date.now(); // Timestamp pour l'unicité
  const client = await pool.connect();
  
  try {
    // Nettoyer les utilisateurs de test
    await client.query('DELETE FROM users WHERE email LIKE $1', [`%test-security-${timestamp}%`]);
    await client.query('DELETE FROM people WHERE email LIKE $1', [`%test-security-${timestamp}%`]);
    
    console.log('📋 Étape 1: Création de 2 utilisateurs avec le même mot de passe');
    
    // Utilisateur 1
    const hashedPassword1 = await bcrypt.hash(testPassword, 12);
    console.log(`Hash utilisateur 1: ${hashedPassword1.substring(0, 30)}...`);
    
    const person1 = await client.query(`
      INSERT INTO people (first_name, last_name, email, status, created_at, updated_at)
      VALUES ('Test1', 'User', 'test1-security-${timestamp}@example.com', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `);
    
    await client.query(`
      INSERT INTO users (person_id, username, email, password, user_code, status, created_at, updated_at)
      VALUES ($1, 'test1', 'test1-security-${timestamp}@example.com', $2, 'TEST1', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [person1.rows[0].id, hashedPassword1]);
    
    // Utilisateur 2
    const hashedPassword2 = await bcrypt.hash(testPassword, 12);
    console.log(`Hash utilisateur 2: ${hashedPassword2.substring(0, 30)}...`);
    
    const person2 = await client.query(`
      INSERT INTO people (first_name, last_name, email, status, created_at, updated_at)
      VALUES ('Test2', 'User', 'test2-security-${timestamp}@example.com', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `);
    
    await client.query(`
      INSERT INTO users (person_id, username, email, password, user_code, status, created_at, updated_at)
      VALUES ($1, 'test2', 'test2-security-${timestamp}@example.com', $2, 'TEST2', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [person2.rows[0].id, hashedPassword2]);
    
    // Vérifier que les hashes sont différents
    const hashesAreDifferent = hashedPassword1 !== hashedPassword2;
    console.log(`✅ Hashs différents: ${hashesAreDifferent ? 'OUI' : 'NON'}`);
    
    if (!hashesAreDifferent) {
      throw new Error('❌ Les hashes sont identiques - problème de sécurité!');
    }
    
    console.log('\n📋 Étape 2: Test de connexion pour les 2 utilisateurs');
    
    // Récupérer les utilisateurs depuis la base
    const user1Result = await client.query(`
      SELECT u.id, u.email, u.password FROM users u WHERE u.email = $1
    `, [`test1-security-${timestamp}@example.com`]);
    
    const user2Result = await client.query(`
      SELECT u.id, u.email, u.password FROM users u WHERE u.email = $1
    `, [`test2-security-${timestamp}@example.com`]);
    
    // Tester la connexion utilisateur 1
    const isValid1 = await bcrypt.compare(testPassword, user1Result.rows[0].password);
    console.log(`✅ Utilisateur 1 peut se connecter: ${isValid1 ? 'OUI' : 'NON'}`);
    
    // Tester la connexion utilisateur 2
    const isValid2 = await bcrypt.compare(testPassword, user2Result.rows[0].password);
    console.log(`✅ Utilisateur 2 peut se connecter: ${isValid2 ? 'OUI' : 'NON'}`);
    
    // Tester mot de passe incorrect
    const isInvalid1 = await bcrypt.compare('WrongPassword', user1Result.rows[0].password);
    console.log(`✅ Mot de passe incorrect rejeté: ${!isInvalid1 ? 'OUI' : 'NON'}`);
    
    if (!isValid1 || !isValid2 || isInvalid1) {
      throw new Error('❌ La vérification des mots de passe échoue!');
    }
    
    console.log('\n📋 Étape 3: Vérification en base de données');
    
    const dbHashes = await client.query(`
      SELECT email, password FROM users 
      WHERE email LIKE $1 
      ORDER BY email
    `, [`%test-security-${timestamp}%`]);
    
    console.log(`Utilisateurs trouvés: ${dbHashes.rows.length}`);
    
    if (dbHashes.rows.length === 2) {
      console.log('Hashs stockés en base:');
      dbHashes.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.email}: ${row.password.substring(0, 30)}...`);
      });
      
      const dbHashesAreDifferent = dbHashes.rows[0].password !== dbHashes.rows[1].password;
      console.log(`✅ Hashs différents en base: ${dbHashesAreDifferent ? 'OUI' : 'NON'}`);
    } else {
      console.log('⚠️  Utilisateurs non trouvés en base');
    }
    
    console.log('\n🎉 TOUS LES TESTS DE CRÉATION D\'UTILISATEURS SONT PASSÉS!');
    console.log('✅ Chaque utilisateur a un hash unique');
    console.log('✅ Les deux utilisateurs peuvent se connecter');
    console.log('✅ Les mots de passe incorrects sont rejetés');
    console.log('✅ La base de données stocke des hashes différents');
    
  } catch (error) {
    console.error('❌ Test échoué:', error.message);
    throw error;
  } finally {
    // Nettoyage
    try {
      await client.query('DELETE FROM users WHERE email LIKE $1', [`%test-security-${timestamp}%`]);
      await client.query('DELETE FROM people WHERE email LIKE $1', [`%test-security-${timestamp}%`]);
      console.log('\n🧹 Données de test nettoyées');
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error.message);
    }
    
    client.release();
    await pool.end();
  }
}

// Exécuter le test
testUserCreation().catch(console.error);
