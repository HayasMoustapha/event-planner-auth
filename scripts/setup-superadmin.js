#!/usr/bin/env node

/**
 * Script simplifié pour configurer le super-admin et appliquer les nouvelles permissions
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuration de la base de données
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_planner_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

const pool = new Pool(config);

async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error(`❌ Erreur SQL: ${error.message}`);
    throw error;
  }
}

async function createPersonIfNotExists() {
  console.log('👤 Vérification/Création de la personne super-admin...');
  
  // Créer une personne pour le super-admin si elle n'existe pas
  const checkPersonQuery = 'SELECT id FROM people WHERE email = $1';
  const personResult = await executeQuery(checkPersonQuery, ['admin@eventplanner.com']);
  
  let personId;
  if (personResult.rows.length === 0) {
    const createPersonQuery = `
      INSERT INTO people (first_name, last_name, email, phone, created_at, updated_at)
      VALUES ('Super', 'Admin', 'admin@eventplanner.com', '+33612345678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const result = await executeQuery(createPersonQuery);
    personId = result.rows[0].id;
    console.log(`✅ Personne super-admin créée avec ID: ${personId}`);
  } else {
    personId = personResult.rows[0].id;
    console.log(`✅ Personne super-admin existe déjà avec ID: ${personId}`);
  }
  
  return personId;
}

async function createSuperAdmin(personId) {
  console.log('👑 Configuration du super-admin...');
  
  // Vérifier si l'utilisateur admin@eventplanner.com existe déjà
  const checkUserQuery = 'SELECT id, username FROM users WHERE email = $1';
  const userResult = await executeQuery(checkUserQuery, ['admin@eventplanner.com']);
  
  let superAdminId;
  if (userResult.rows.length === 0) {
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    // Créer le super-admin
    const createUserQuery = `
      INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
      VALUES ('superadmin', 'admin@eventplanner.com', $1, 'SUPER_ADMIN', '+33612345678', 'active', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const result = await executeQuery(createUserQuery, [hashedPassword, personId]);
    superAdminId = result.rows[0].id;
    console.log(`✅ Super-admin créé avec ID: ${superAdminId}`);
  } else {
    superAdminId = userResult.rows[0].id;
    const username = userResult.rows[0].username;
    console.log(`✅ Utilisateur existant '${username}' (ID: ${superAdminId}) sera configuré comme super-admin`);
    
    // Mettre à jour le user_code pour identifier clairement le super-admin
    await executeQuery(
      'UPDATE users SET user_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['SUPER_ADMIN', superAdminId]
    );
  }
  
  return superAdminId;
}

async function assignAllPermissions(superAdminId) {
  console.log('🔐 Assignation de toutes les permissions au super-admin...');
  
  // Supprimer les permissions existantes pour éviter les doublons
  await executeQuery('DELETE FROM user_permissions WHERE user_id = $1', [superAdminId]);
  
  // Assigner toutes les permissions existantes
  const assignQuery = `
    INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
    SELECT $1, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM permissions p
    ON CONFLICT (user_id, permission_id) DO NOTHING
  `;
  
  const result = await executeQuery(assignQuery, [superAdminId]);
  console.log(`✅ ${result.rowCount} permissions assignées au super-admin`);
}

async function showSummary(superAdminId) {
  console.log('\n📊 RÉSUMÉ DE LA CONFIGURATION');
  console.log('================================');
  
  const summaryQuery = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.status,
      COUNT(up.permission_id) as permission_count
    FROM users u
    LEFT JOIN user_permissions up ON u.id = up.user_id
    WHERE u.id = $1
    GROUP BY u.id, u.username, u.email, u.status
  `;
  
  const summary = await executeQuery(summaryQuery, [superAdminId]);
  
  if (summary.rows.length > 0) {
    const row = summary.rows[0];
    console.log(`👤 ID: ${row.id}`);
    console.log(`📧 Email: ${row.email}`);
    console.log(`🔐 Statut: ${row.status}`);
    console.log(`🔑 Permissions: ${row.permission_count}`);
  }
  
  console.log('\n🔑 IDENTIFIANTS DE CONNEXION:');
  console.log('   Email: admin@eventplanner.com');
  console.log('   Mot de passe: Admin123!');
}

async function main() {
  console.log('🎯 SCRIPT DE CONFIGURATION SUPER-ADMIN');
  console.log('=====================================\n');
  
  try {
    // Étape 1: Créer la personne
    const personId = await createPersonIfNotExists();
    
    // Étape 2: Créer le super-admin
    const superAdminId = await createSuperAdmin(personId);
    
    // Étape 3: Assigner toutes les permissions
    await assignAllPermissions(superAdminId);
    
    // Étape 4: Afficher le résumé
    await showSummary(superAdminId);
    
    console.log('\n🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!');
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = {
  createPersonIfNotExists,
  createSuperAdmin,
  assignAllPermissions
};
