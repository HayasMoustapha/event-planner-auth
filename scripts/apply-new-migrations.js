#!/usr/bin/env node

/**
 * Script pour appliquer uniquement les migrations non exécutées
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function getExecutedMigrations() {
  const query = 'SELECT migration_name FROM schema_migrations ORDER BY migration_name';
  const result = await executeQuery(query);
  return result.rows.map(row => row.migration_name);
}

async function executeMigration(migrationPath, migrationName) {
  console.log(`🔄 Exécution de la migration: ${migrationName}`);
  
  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query('BEGIN');
    
    try {
      await pool.query(migrationSQL);
      
      await pool.query(
        'INSERT INTO schema_migrations (migration_name, checksum, file_size, execution_time_ms, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [migrationName, 'checksum_placeholder', fs.statSync(migrationPath).size, 0]
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

async function applyNewMigrations() {
  console.log('🚀 APPLICATION DES MIGRATIONS NON EXÉCUTÉES');
  console.log('==========================================\n');
  
  try {
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 Migrations déjà exécutées: ${executedMigrations.length}`);
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => !file.includes('export'))
      .sort();
    
    console.log(`📁 Fichiers de migration trouvés: ${migrationFiles.length}`);
    
    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        const migrationPath = path.join(migrationsDir, file);
        const success = await executeMigration(migrationPath, file);
        if (success) {
          appliedCount++;
        }
      } else {
        console.log(`⏭️  Déjà appliquée: ${file}`);
      }
    }
    
    console.log(`\n📊 Bilan: ${appliedCount} nouvelle(s) migration(s) appliquée(s)`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  applyNewMigrations();
}

module.exports = { applyNewMigrations };
