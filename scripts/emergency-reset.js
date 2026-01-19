#!/usr/bin/env node

/**
 * Script d'urgence pour réinitialiser les transactions et corriger la base
 */

const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_planner_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

async function resetDatabaseConnection() {
  console.log('🔄 RÉINITIALISATION DE LA BASE DE DONNÉES');
  console.log('=====================================\n');
  
  let pool;
  try {
    // Créer une nouvelle connexion propre
    pool = new Pool(config);
    
    // Forcer la rollback de toutes les transactions
    console.log('🧹 Nettoyage des transactions en cours...');
    await pool.query('ROLLBACK');
    console.log('✅ Transactions nettoyées');
    
    // Vérifier l'état de la base
    console.log('\n🔍 Vérification de l\'état de la base...');
    
    const tablesCheck = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const result = await pool.query(tablesCheck);
    console.log(`📊 ${result.rows.length} tables trouvées:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Créer la table schema_migrations si elle n'existe pas
    console.log('\n🔧 Vérification de schema_migrations...');
    const migrationCheck = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `;
    
    const migrationExists = await pool.query(migrationCheck);
    
    if (!migrationExists.rows[0].exists) {
      console.log('📝 Création de la table schema_migrations...');
      const createTableQuery = `
        CREATE TABLE schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          checksum VARCHAR(64) NOT NULL,
          file_size BIGINT NOT NULL,
          execution_time_ms INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_schema_migrations_created_at 
        ON schema_migrations(created_at);
        
        CREATE INDEX idx_schema_migrations_name 
        ON schema_migrations(migration_name);
      `;
      
      await pool.query(createTableQuery);
      console.log('✅ Table schema_migrations créée');
    } else {
      console.log('✅ Table schema_migrations existe déjà');
    }
    
    // Créer une personne d'abord
    console.log('👤 Création de la personne associée...');
    const createPersonQuery = `
      INSERT INTO people (first_name, last_name, email, phone, created_at, updated_at)
      VALUES ('Super', 'Admin', 'admin@eventplanner.com', '+33612345678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const personResult = await pool.query(createPersonQuery);
    const personId = personResult.rows[0].id;
    console.log(`✅ Personne créée avec ID: ${personId}`);
    
    // Créer un super-admin de base
    console.log('\n👑 Création du super-admin de secours...');
    const bcrypt = require('bcrypt');
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insérer l'utilisateur avec la personne
    const createUserQuery = `
      INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
      VALUES ('admin', 'admin@eventplanner.com', $1, 'SUPER_ADMIN', '+33612345678', 'active', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        password = $1,
        user_code = 'SUPER_ADMIN',
        person_id = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const userResult = await pool.query(createUserQuery, [hashedPassword, personId]);
    const userId = userResult.rows[0].id;
    console.log(`✅ Super-admin créé avec ID: ${userId}`);
    
    console.log('\n🎉 RÉINITIALISATION TERMINÉE!');
    console.log('✅ Base de données dans un état cohérent');
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
  resetDatabaseConnection();
}

module.exports = { resetDatabaseConnection };
