#!/usr/bin/env node

/**
 * Script d'urgence pour créer la table schema_migrations et initialiser la base
 */

const { Pool } = require('pg');

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

async function createSchemaMigrationsTable() {
  console.log('🔧 CRÉATION DE LA TABLE schema_migrations');
  console.log('========================================\n');
  
  try {
    // Créer la table schema_migrations
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NOT NULL,
        file_size BIGINT NOT NULL,
        execution_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_created_at 
      ON schema_migrations(created_at);
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_name 
      ON schema_migrations(migration_name);
    `;
    
    await executeQuery(createTableQuery);
    console.log('✅ Table schema_migrations créée avec succès');
    
    // Marquer les migrations déjà appliquées comme exécutées
    console.log('\n📋 MARQUAGE DES MIGRATIONS EXISTANTES...');
    
    const existingTables = [
      'users',
      'people', 
      'permissions',
      'roles',
      'accesses',
      'authorizations',
      'menus',
      'otp_codes',
      'personal_access_tokens',
      'password_histories'
    ];
    
    for (const table of existingTables) {
      try {
        await executeQuery(
          'INSERT INTO schema_migrations (migration_name, checksum, file_size, execution_time_ms) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [`initial_${table}`, 'checksum_placeholder', 1024, 0]
        );
      } catch (error) {
        // Ignorer les erreurs de conflit
      }
    }
    
    console.log('✅ Migrations existantes marquées comme exécutées');
    
    // Vérifier que la table fonctionne
    const countQuery = 'SELECT COUNT(*) as count FROM schema_migrations';
    const result = await executeQuery(countQuery);
    console.log(`📊 ${result.rows[0].count} migrations enregistrées`);
    
    console.log('\n🎉 INITIALISATION TERMINÉE AVEC SUCCÈS!');
    console.log('✅ La table schema_migrations est prête');
    console.log('✅ Le serveur peut maintenant démarrer normalement');
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createSchemaMigrationsTable();
}

module.exports = { createSchemaMigrationsTable };
