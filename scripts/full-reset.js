#!/usr/bin/env node

/**
 * Script radical pour réinitialiser complètement la base de données
 */

const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_planner_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

async function fullReset() {
  console.log('🔥 RÉINITIALISATION COMPLÈTE DE LA BASE');
  console.log('====================================\n');
  
  let pool;
  try {
    // Se connecter à la base de données postgres (pas à la base spécifique)
    const adminConfig = { ...config, database: 'postgres' };
    pool = new Pool(adminConfig);
    
    console.log('🔪 Arrêt de toutes les connexions à la base...');
    await pool.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [config.database]);
    
    console.log('🗑️ Suppression de la base de données...');
    try {
      await pool.query(`DROP DATABASE IF EXISTS ${config.database}`);
      console.log('✅ Base de données supprimée');
    } catch (error) {
      console.log('⚠️ La base de données n\'existait pas');
    }
    
    console.log('📝 Création de la base de données...');
    await pool.query(`CREATE DATABASE ${config.database}`);
    console.log('✅ Base de données créée');
    
    await pool.end();
    
    // Se reconnecter à la nouvelle base
    pool = new Pool(config);
    
    console.log('🔧 Application des migrations initiales...');
    
    // Appliquer la migration initiale
    const fs = require('fs');
    const path = require('path');
    
    const initialMigration = fs.readFileSync(
      path.join(__dirname, '../database/migrations/000_initial_schema.sql'),
      'utf8'
    );
    
    await pool.query(initialMigration);
    console.log('✅ Migration initiale appliquée');
    
    // Créer la table schema_migrations
    console.log('📋 Création de schema_migrations...');
    await pool.query(`
      CREATE TABLE schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NOT NULL,
        file_size BIGINT NOT NULL,
        execution_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      INSERT INTO schema_migrations (migration_name, checksum, file_size, execution_time_ms)
      VALUES ('000_initial_schema.sql', 'checksum', 1024, 0)
    `);
    
    console.log('✅ Schema migrations créé');
    
    // Créer le super-admin
    console.log('👑 Création du super-admin...');
    const bcrypt = require('bcrypt');
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Créer la personne
    const personResult = await pool.query(`
      INSERT INTO people (first_name, last_name, email, phone, created_at, updated_at)
      VALUES ('Super', 'Admin', 'admin@eventplanner.com', '+33612345678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `);
    
    const personId = personResult.rows[0].id;
    
    // Créer l'utilisateur
    const userResult = await pool.query(`
      INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
      VALUES ('admin', 'admin@eventplanner.com', $1, 'SUPER_ADMIN', '+33612345678', 'active', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `, [hashedPassword, personId]);
    
    const userId = userResult.rows[0].id;
    
    console.log(`✅ Personne: ${personId}, Utilisateur: ${userId}`);
    
    console.log('\n🎉 RÉINITIALISATION TERMINÉE!');
    console.log('✅ Base de données propre et fonctionnelle');
    console.log('✅ Super-admin disponible');
    console.log('\n🔑 IDENTIFIANTS:');
    console.log('   Email: admin@eventplanner.com');
    console.log(`   Mot de passe: ${password}`);
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  fullReset();
}

module.exports = { fullReset };
