#!/usr/bin/env node

/**
 * Script pour créer le super-admin avec un mot de passe connu
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

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

async function createSuperAdminWithPassword() {
  console.log('🎯 CRÉATION DU SUPER-ADMIN AVEC MOT DE PASSE CONNU');
  console.log('===============================================\n');
  
  try {
    // Étape 1: Créer la personne
    console.log('👤 Création de la personne super-admin...');
    const createPersonQuery = `
      INSERT INTO people (first_name, last_name, email, phone, created_at, updated_at)
      VALUES ('Super', 'Admin', 'admin@eventplanner.com', '+33612345678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    
    const personResult = await executeQuery(createPersonQuery);
    let personId;
    
    if (personResult.rows.length > 0) {
      personId = personResult.rows[0].id;
      console.log(`✅ Personne créée avec ID: ${personId}`);
    } else {
      const existingPersonQuery = 'SELECT id FROM people WHERE email = $1';
      const existingResult = await executeQuery(existingPersonQuery, ['admin@eventplanner.com']);
      personId = existingResult.rows[0].id;
      console.log(`✅ Personne existante trouvée avec ID: ${personId}`);
    }
    
    // Étape 2: Créer l'utilisateur avec mot de passe connu
    console.log('👑 Création de l\'utilisateur super-admin...');
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const createUserQuery = `
      INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
      VALUES ('admin', 'admin@eventplanner.com', $1, 'SUPER_ADMIN', '+33612345678', 'active', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const userResult = await executeQuery(createUserQuery, [hashedPassword, personId]);
    const userId = userResult.rows[0].id;
    console.log(`✅ Utilisateur créé avec ID: ${userId}`);
    
    // Étape 3: Créer le rôle super-admin
    console.log('🔐 Création du rôle super-admin...');
    const createRoleQuery = `
      INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at)
      VALUES ('SUPER_ADMIN', '{"fr": "Super Administrateur"}', '{"fr": "Accès complet à toutes les fonctionnalités"}', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const roleResult = await executeQuery(createRoleQuery);
    const roleId = roleResult.rows[0].id;
    console.log(`✅ Rôle créé avec ID: ${roleId}`);
    
    // Étape 4: Assigner le rôle à l'utilisateur
    console.log('🔗 Assignation du rôle à l\'utilisateur...');
    const createAccessQuery = `
      INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
      VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await executeQuery(createAccessQuery, [userId, roleId]);
    console.log(`✅ Accès créé`);
    
    // Étape 5: Assigner toutes les permissions au rôle
    console.log('🔑 Assignation de toutes les permissions...');
    
    // Créer un menu par défaut si nécessaire
    const createMenuQuery = `
      INSERT INTO menus (code, label, icon, route, is_system, created_at, updated_at)
      VALUES ('ALL', '{"fr": "Tous"}', 'shield', '/admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO NOTHING
      RETURNING id
    `;
    
    const menuResult = await executeQuery(createMenuQuery);
    const menuId = menuResult.rows[0]?.id || 
      (await executeQuery('SELECT id FROM menus WHERE code = $1', ['ALL'])).rows[0].id;
    
    const assignPermissionsQuery = `
      INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
      SELECT $1, p.id, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM permissions p
      WHERE p.deleted_at IS NULL
    `;
    
    const permissionsResult = await executeQuery(assignPermissionsQuery, [roleId, menuId]);
    console.log(`✅ ${permissionsResult.rowCount} permissions assignées`);
    
    // Afficher le résumé
    console.log('\n📊 RÉSUMÉ DE CRÉATION');
    console.log('=====================');
    console.log(`👤 Utilisateur: admin`);
    console.log(`📧 Email: admin@eventplanner.com`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log(`👑 Rôle: SUPER_ADMIN`);
    console.log(`🔐 Permissions: ${permissionsResult.rowCount}`);
    
    console.log('\n🎉 SUPER-ADMIN CRÉÉ AVEC SUCCÈS!');
    console.log('🔑 IDENTIFIANTS DE CONNEXION:');
    console.log('   Email: admin@eventplanner.com');
    console.log(`   Mot de passe: ${password}`);
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createSuperAdminWithPassword();
}

module.exports = { createSuperAdminWithPassword };
