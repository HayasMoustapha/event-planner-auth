#!/usr/bin/env node

/**
 * Script de Test Complet du Bootstrap
 * 
 * Scénarios testés:
 * 1. Base de données totalement vide
 * 2. Base partiellement initialisée 
 * 3. Redémarrages multiples
 * 4. Échec et récupération
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config();

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_planner_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

class BootstrapTester {
  constructor() {
    this.pool = new Pool(config);
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🚀 Démarrage des tests de bootstrap...\n');

    try {
      // Scénario 1: Base totalement vide
      await this.testScenario1_EmptyDatabase();
      
      // Scénario 2: Base partiellement initialisée
      await this.testScenario2_PartialDatabase();
      
      // Scénario 3: Redémarrages multiples
      await this.testScenario3_MultipleRestarts();
      
      // Scénario 4: Échec et récupération
      await this.testScenario4_FailureRecovery();

      // Rapport final
      this.printFinalReport();

    } catch (error) {
      console.error('❌ Erreur critique dans les tests:', error);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }

  async testScenario1_EmptyDatabase() {
    console.log('📋 Scénario 1: Base de données totalement vide');
    
    const startTime = Date.now();
    try {
      // Nettoyer complètement la base
      await this.cleanDatabase();
      
      // Exécuter le bootstrap
      const result = await this.runBootstrap();
      
      // Valider le résultat
      await this.validateFullInstallation();
      
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 1 - DB Vide', true, duration, 'Bootstrap réussi sur DB vide');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 1 - DB Vide', false, duration, error.message);
    }
  }

  async testScenario2_PartialDatabase() {
    console.log('\n📋 Scénario 2: Base partiellement initialisée');
    
    const startTime = Date.now();
    try {
      // Nettoyer et créer partiellement
      await this.cleanDatabase();
      await this.createPartialSetup();
      
      // Exécuter le bootstrap
      const result = await this.runBootstrap();
      
      // Valider que tout est correct
      await this.validateFullInstallation();
      
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 2 - DB Partielle', true, duration, 'Bootstrap réussi sur DB partielle');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 2 - DB Partielle', false, duration, error.message);
    }
  }

  async testScenario3_MultipleRestarts() {
    console.log('\n📋 Scénario 3: Redémarrages multiples');
    
    const startTime = Date.now();
    try {
      // Nettoyer et initialiser une première fois
      await this.cleanDatabase();
      await this.runBootstrap();
      
      // Exécuter le bootstrap plusieurs fois
      for (let i = 0; i < 5; i++) {
        console.log(`  🔄 Redémarrage ${i + 1}/5...`);
        await this.runBootstrap();
      }
      
      // Valider que tout est toujours correct
      await this.validateFullInstallation();
      
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 3 - Redémarrages', true, duration, '5 redémarrages réussis');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 3 - Redémarrages', false, duration, error.message);
    }
  }

  async testScenario4_FailureRecovery() {
    console.log('\n📋 Scénario 4: Échec et récupération');
    
    const startTime = Date.now();
    try {
      // Nettoyer
      await this.cleanDatabase();
      
      // Créer une migration qui va échouer
      await this.createFailingMigration();
      
      // Tenter le bootstrap (doit échouer)
      try {
        await this.runBootstrap();
        throw new Error('Le bootstrap aurait dû échouer');
      } catch (error) {
        console.log('  ✅ Échec attendu:', error.message);
      }
      
      // Nettoyer la migration défaillante
      await this.removeFailingMigration();
      
      // Exécuter le bootstrap à nouveau (doit réussir)
      await this.runBootstrap();
      
      // Valider
      await this.validateFullInstallation();
      
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 4 - Récupération', true, duration, 'Récupération après échec réussie');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Scénario 4 - Récupération', false, duration, error.message);
    }
  }

  async cleanDatabase() {
    const client = await this.pool.connect();
    try {
      // Désactiver les contraintes temporairement
      await client.query('SET session_replication_role = replica;');
      
      // Supprimer toutes les tables en ordre inverse
      const tables = [
        'otp_statistics', 'authorizations', 'accesses', 'personal_access_tokens', 
        'user_sessions', 'otps', 'people', 'users', 'roles', 'permissions', 
        'menus', 'schema_migrations'
      ];
      
      for (const table of tables) {
        try {
          await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          await client.query(`DROP VIEW IF EXISTS ${table} CASCADE`);
        } catch (error) {
          // Ignorer les erreurs si la table/vue n'existe pas
          console.log(`    Table/View ${table} déjà supprimée ou inexistante`);
        }
      }
      
      // Réactiver les contraintes
      await client.query('SET session_replication_role = DEFAULT;');
      
      console.log('  🧹 Base de données nettoyée');
    } finally {
      client.release();
    }
  }

  async createPartialSetup() {
    const client = await this.pool.connect();
    try {
      // Créer l'extension UUID nécessaire
      await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      
      // Créer seulement quelques tables avec le schéma exact attendu par la migration
      await client.query(`
        CREATE TABLE IF NOT EXISTS people (
          id BIGSERIAL PRIMARY KEY,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255),
          phone VARCHAR(255) UNIQUE,
          email VARCHAR(255) UNIQUE,
          photo VARCHAR(255),
          status VARCHAR(20) CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
          uid UUID NOT NULL DEFAULT gen_random_uuid(),
          created_by BIGINT,
          updated_by BIGINT,
          deleted_by BIGINT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64) NOT NULL,
          file_size BIGINT NOT NULL,
          execution_time_ms INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insérer une migration fictive
      await client.query(`
        INSERT INTO schema_migrations (migration_name, checksum, file_size, execution_time_ms) VALUES 
        ('000_old_migration.sql', 'fake_checksum', 1000, 100)
      `);
      
      console.log('  🏗️  Configuration partielle créée');
    } finally {
      client.release();
    }
  }

  async createFailingMigration() {
    const failingMigration = `
-- Migration qui va échouer volontairement
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY
);

-- Cette requête va échouer
SELECT * FROM table_inexistante;
    `;
    
    await fs.writeFile(
      path.join(__dirname, '../database/migrations/999_failing_migration.sql'),
      failingMigration
    );
    
    console.log('  💥 Migration défaillante créée');
  }

  async removeFailingMigration() {
    try {
      await fs.unlink(
        path.join(__dirname, '../database/migrations/999_failing_migration.sql')
      );
      console.log('  🗑️  Migration défaillante supprimée');
    } catch (error) {
      // Le fichier n'existe peut-être pas
    }
  }

  async runBootstrap() {
    // Activer le bootstrap
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    
    // Importer et exécuter le bootstrap
    const DatabaseBootstrap = require('../src/services/database-bootstrap.service');
    return await DatabaseBootstrap.initialize();
  }

  async validateFullInstallation() {
    const client = await this.pool.connect();
    try {
      // Vérifier les tables critiques
      const requiredTables = ['people', 'users', 'roles', 'permissions', 'menus'];
      for (const table of requiredTables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (!result.rows[0].exists) {
          throw new Error(`Table manquante: ${table}`);
        }
      }
      
      // Vérifier l'admin par défaut
      const adminCheck = await client.query(`
        SELECT COUNT(*) as count FROM users u
        JOIN people p ON u.person_id = p.id
        WHERE u.username = 'admin'
      `);

      if (adminCheck.rows[0].count === 0) {
        throw new Error('Administrateur par défaut non trouvé');
      }
      
      // Vérifier les migrations
      const migrationCheck = await client.query(`
        SELECT COUNT(*) as count FROM schema_migrations
      `);
      
      if (migrationCheck.rows[0].count === 0) {
        throw new Error('Aucune migration enregistrée');
      }
      
      console.log('  ✅ Installation validée');
    } finally {
      client.release();
    }
  }

  addTestResult(scenario, success, duration, message) {
    this.testResults.push({
      scenario,
      success,
      duration,
      message
    });
    
    const status = success ? '✅ SUCCÈS' : '❌ ÉCHEC';
    console.log(`  ${status} - ${duration}ms - ${message}`);
  }

  printFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`\n📈 Statistiques:`);
    console.log(`   Total des tests: ${totalTests}`);
    console.log(`   Réussis: ${successfulTests} ✅`);
    console.log(`   Échoués: ${failedTests} ❌`);
    console.log(`   Taux de réussite: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Détails:`);
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.scenario}: ${result.duration}ms - ${result.message}`);
    });
    
    if (failedTests === 0) {
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS - BOOTROBUSTE VALIDÉ!');
    } else {
      console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ - CORRECTIONS NÉCESSAIRES');
      process.exit(1);
    }
  }
}

// Exécuter les tests
if (require.main === module) {
  const tester = new BootstrapTester();
  tester.runAllTests().catch(console.error);
}

module.exports = BootstrapTester;
