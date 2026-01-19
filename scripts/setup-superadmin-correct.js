#!/usr/bin/env node

/**
 * Script pour configurer le super-admin avec toutes les permissions
 * Architecture: users -> accesses -> roles -> authorizations -> permissions
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

async function createSuperAdminRole() {
  console.log('👑 Vérification/Création du rôle super-admin...');
  
  // Vérifier si le rôle super-admin existe
  const checkRoleQuery = 'SELECT id FROM roles WHERE code = $1';
  const roleResult = await executeQuery(checkRoleQuery, ['SUPER_ADMIN']);
  
  let roleId;
  if (roleResult.rows.length === 0) {
    // Créer le rôle super-admin
    const createRoleQuery = `
      INSERT INTO roles (code, label, description, is_system, level, created_at, updated_at)
      VALUES ('SUPER_ADMIN', '{"fr": "Super Administrateur"}', '{"fr": "Accès complet à toutes les fonctionnalités"}', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const result = await executeQuery(createRoleQuery);
    roleId = result.rows[0].id;
    console.log(`✅ Rôle super-admin créé avec ID: ${roleId}`);
  } else {
    roleId = roleResult.rows[0].id;
    console.log(`✅ Rôle super-admin existe déjà avec ID: ${roleId}`);
  }
  
  return roleId;
}

async function assignRoleToUser(userId, roleId) {
  console.log('🔗 Assignation du rôle super-admin à l\'utilisateur...');
  
  // Supprimer les accès existants pour cet utilisateur
  await executeQuery('DELETE FROM accesses WHERE user_id = $1', [userId]);
  
  // Créer l'accès au rôle super-admin
  const createAccessQuery = `
    INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
    VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, role_id) DO UPDATE SET
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
  `;
  
  await executeQuery(createAccessQuery, [userId, roleId]);
  console.log(`✅ Utilisateur ${userId} assigné au rôle super-admin`);
}

async function assignAllPermissionsToRole(roleId) {
  console.log('🔐 Assignation de toutes les permissions au rôle super-admin...');
  
  // Supprimer les autorisations existantes pour ce rôle
  await executeQuery('DELETE FROM authorizations WHERE role_id = $1', [roleId]);
  
  // Récupérer tous les menus disponibles (pour les autorisations)
  const menusQuery = 'SELECT id FROM menus WHERE deleted_at IS NULL';
  const menusResult = await executeQuery(menusQuery);
  
  if (menusResult.rows.length === 0) {
    console.log('⚠️ Aucun menu trouvé, création d\'un menu par défaut...');
    const createMenuQuery = `
      INSERT INTO menus (code, label, icon, route, is_system, created_at, updated_at)
      VALUES ('ALL', '{"fr": "Tous"}', 'shield', '/admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const menuResult = await executeQuery(createMenuQuery);
    const menuId = menuResult.rows[0].id;
    
    // Assigner toutes les permissions avec ce menu
    const assignQuery = `
      INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
      SELECT $1, p.id, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM permissions p
      WHERE p.deleted_at IS NULL
    `;
    
    const result = await executeQuery(assignQuery, [roleId, menuId]);
    console.log(`✅ ${result.rowCount} permissions assignées au rôle super-admin`);
  } else {
    // Assigner toutes les permissions avec tous les menus
    let totalAssigned = 0;
    for (const menu of menusResult.rows) {
      const assignQuery = `
        INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
        SELECT $1, p.id, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM permissions p
        WHERE p.deleted_at IS NULL
        ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING
      `;
      
      const result = await executeQuery(assignQuery, [roleId, menu.id]);
      totalAssigned += result.rowCount;
    }
    console.log(`✅ ${totalAssigned} permissions assignées au rôle super-admin`);
  }
}

async function setupSuperAdmin() {
  console.log('🎯 CONFIGURATION DU SUPER-ADMIN');
  console.log('================================\n');
  
  try {
    // Étape 1: Trouver l'utilisateur admin existant
    console.log('👤 Recherche de l\'utilisateur admin...');
    const userQuery = 'SELECT id, username, email FROM users WHERE email = $1';
    const userResult = await executeQuery(userQuery, ['admin@eventplanner.com']);
    
    if (userResult.rows.length === 0) {
      throw new Error('Utilisateur admin@eventplanner.com non trouvé');
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Utilisateur trouvé: ${user.username} (ID: ${user.id})`);
    
    // Mettre à jour le user_code pour identifier clairement le super-admin
    await executeQuery(
      'UPDATE users SET user_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['SUPER_ADMIN', user.id]
    );
    
    // Étape 2: Créer le rôle super-admin
    const roleId = await createSuperAdminRole();
    
    // Étape 3: Assigner le rôle à l'utilisateur
    await assignRoleToUser(user.id, roleId);
    
    // Étape 4: Assigner toutes les permissions au rôle
    await assignAllPermissionsToRole(roleId);
    
    // Étape 5: Afficher le résumé
    console.log('\n📊 RÉSUMÉ DE LA CONFIGURATION');
    console.log('================================');
    console.log(`👤 Utilisateur: ${user.username} (${user.email})`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`👑 Rôle: SUPER_ADMIN (ID: ${roleId})`);
    console.log(`🔐 Permissions: Toutes`);
    
    console.log('\n🔑 IDENTIFIANTS DE CONNEXION:');
    console.log('   Email: admin@eventplanner.com');
    console.log('   Mot de passe: (mot de passe existant)');
    
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
  setupSuperAdmin();
}

module.exports = {
  createSuperAdminRole,
  assignRoleToUser,
  assignAllPermissionsToRole
};
