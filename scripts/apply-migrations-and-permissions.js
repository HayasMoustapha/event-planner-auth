#!/usr/bin/env node

/**
 * Script d'application des migrations et configuration du super-admin
 * Applique toutes les migrations en attente et assigne toutes les permissions au super-admin
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
    console.error(`❌ Erreur lors de l'exécution de la query: ${query.substring(0, 100)}...`);
    console.error(`Détail: ${error.message}`);
    throw error;
  }
}

async function checkAndCreateSchemaMigrations() {
  console.log('🔍 Vérification de la table schema_migrations...');
  
  const checkTableQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    );
  `;
  
  const result = await executeQuery(checkTableQuery);
  
  if (!result.rows[0].exists) {
    console.log('📝 Création de la table schema_migrations...');
    const createTableQuery = `
      CREATE TABLE schema_migrations (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await executeQuery(createTableQuery);
    console.log('✅ Table schema_migrations créée');
  } else {
    console.log('✅ Table schema_migrations existe déjà');
  }
}

async function getExecutedMigrations() {
  const query = 'SELECT migration_name FROM schema_migrations ORDER BY migration_name';
  const result = await executeQuery(query);
  return result.rows.map(row => row.migration_name);
}

async function executeMigration(migrationPath, migrationName) {
  console.log(`🔄 Exécution de la migration: ${migrationName}`);
  
  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration dans une transaction
    await pool.query('BEGIN');
    
    try {
      await pool.query(migrationSQL);
      
      // Marquer la migration comme exécutée
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [migrationName]
      );
      
      await pool.query('COMMIT');
      console.log(`✅ Migration ${migrationName} appliquée avec succès`);
      return true;
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de ${migrationName}: ${error.message}`);
    return false;
  }
}

async function applyAllMigrations() {
  console.log('\n🚀 DÉBUT DE L\'APPLICATION DES MIGRATIONS\n');
  
  try {
    // Vérifier/créer la table schema_migrations
    await checkAndCreateSchemaMigrations();
    
    // Récupérer les migrations déjà exécutées
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 Migrations déjà exécutées: ${executedMigrations.length}`);
    
    // Lister toutes les fichiers de migration
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.includes('export')) // Exclure les fichiers d'export
      .sort();
    
    console.log(`📁 Fichiers de migration trouvés: ${migrationFiles.length}`);
    
    // Appliquer les migrations non exécutées
    let appliedCount = 0;
    for (const file of migrationFiles) {
      const migrationName = file;
      const migrationPath = path.join(migrationsDir, file);
      
      if (!executedMigrations.includes(migrationName)) {
        const success = await executeMigration(migrationPath, migrationName);
        if (success) {
          appliedCount++;
        }
      } else {
        console.log(`⏭️  Migration déjà appliquée: ${migrationName}`);
      }
    }
    
    console.log(`\n📊 Bilan des migrations: ${appliedCount} nouvelle(s) migration(s) appliquée(s)`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des migrations:', error.message);
    throw error;
  }
}

async function assignSuperAdminPermissions() {
  console.log('\n👑 CONFIGURATION DU SUPER-ADMIN\n');
  
  try {
    // Vérifier si le super-admin existe
    const checkSuperAdminQuery = 'SELECT id FROM users WHERE username = $1';
    const superAdminResult = await executeQuery(checkSuperAdminQuery, ['superadmin']);
    
    if (superAdminResult.rows.length === 0) {
      console.log('📝 Création du super-admin...');
      
      // Créer le super-admin avec un mot de passe par défaut
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const createSuperAdminQuery = `
        INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
        VALUES ('superadmin', 'admin@eventplanner.com', $1, 'SUPER_ADMIN', '+33612345678', 'active', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      
      const result = await executeQuery(createSuperAdminQuery, [hashedPassword]);
      const superAdminId = result.rows[0].id;
      console.log(`✅ Super-admin créé avec ID: ${superAdminId}`);
    } else {
      console.log(`✅ Super-admin existe déjà avec ID: ${superAdminResult.rows[0].id}`);
    }
    
    // Récupérer l'ID du super-admin
    const superAdminId = superAdminResult.rows[0]?.id || 
      (await executeQuery(checkSuperAdminQuery, ['superadmin'])).rows[0].id;
    
    // Supprimer les permissions existantes du super-admin pour éviter les doublons
    console.log('🧹 Nettoyage des permissions existantes...');
    await executeQuery('DELETE FROM user_permissions WHERE user_id = $1', [superAdminId]);
    
    // Assigner toutes les permissions au super-admin
    console.log('🔐 Assignation de toutes les permissions au super-admin...');
    
    const assignPermissionsQuery = `
      INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
      SELECT $1, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM permissions p
      ON CONFLICT (user_id, permission_id) DO NOTHING
    `;
    
    const result = await executeQuery(assignPermissionsQuery, [superAdminId]);
    console.log(`✅ ${result.rowCount} permissions assignées au super-admin`);
    
    // Afficher le résumé
    const summaryQuery = `
      SELECT 
        u.username,
        u.email,
        COUNT(up.permission_id) as permission_count
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      WHERE u.username = 'superadmin'
      GROUP BY u.id, u.username, u.email
    `;
    
    const summary = await executeQuery(summaryQuery);
    if (summary.rows.length > 0) {
      const row = summary.rows[0];
      console.log('\n📊 RÉSUMÉ SUPER-ADMIN:');
      console.log(`   👤 Utilisateur: ${row.username}`);
      console.log(`   📧 Email: ${row.email}`);
      console.log(`   🔐 Permissions: ${row.permission_count}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du super-admin:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🎯 SCRIPT DE MIGRATION ET CONFIGURATION SUPER-ADMIN');
  console.log('==================================================\n');
  
  try {
    // Appliquer toutes les migrations
    await applyAllMigrations();
    
    // Configurer le super-admin
    await assignSuperAdminPermissions();
    
    console.log('\n🎉 SUCCÈS COMPLET!');
    console.log('✅ Toutes les migrations ont été appliquées');
    console.log('✅ Le super-admin a toutes les permissions');
    console.log('\n🔑 Identifiants super-admin:');
    console.log('   Email: admin@eventplanner.com');
    console.log('   Mot de passe: Admin123!');
    
  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error.message);
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
  applyAllMigrations,
  assignSuperAdminPermissions
};
