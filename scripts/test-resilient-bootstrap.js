#!/usr/bin/env node

/**
 * Script de test complet pour le bootstrap résilient
 * Teste tous les scénarios : DB vide, DB partielle, redémarrages
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const ResilientDatabaseBootstrap = require('../src/services/resilient-database-bootstrap.service');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'event_planner_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

class BootstrapTester {
  constructor() {
    this.testResults = [];
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 TEST: ${testName}`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    const result = {
      name: testName,
      success: false,
      duration: 0,
      error: null,
      details: {}
    };

    try {
      const testResult = await testFunction();
      result.success = true;
      result.details = testResult;
      console.log(`✅ ${testName}: SUCCÈS`);
    } catch (error) {
      result.error = error.message;
      console.log(`❌ ${testName}: ÉCHEC - ${error.message}`);
    }
    
    result.duration = Date.now() - startTime;
    this.testResults.push(result);
    
    return result;
  }

  async testScenario1_EmptyDatabase() {
    // Scénario 1: Base complètement vide
    console.log('🗑️  Suppression complète de la base...');
    
    const adminPool = new Pool({ ...config, database: 'postgres' });
    
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${config.database}`);
      await adminPool.query(`CREATE DATABASE ${config.database}`);
      console.log('✅ Base vide créée');
    } finally {
      await adminPool.end();
    }

    // Tester le bootstrap
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    const bootstrap = new ResilientDatabaseBootstrap();
    const result = await bootstrap.initialize();
    
    return {
      bootstrapResult: result,
      databaseState: await this.getDatabaseState()
    };
  }

  async testScenario2_PartialDatabase() {
    // Scénario 2: Base partiellement initialisée
    console.log('🔧 Création d\'une base partielle...');
    
    await this.resetDatabase();
    await this.createPartialSchema();
    
    // Tester le bootstrap
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    const bootstrap = new ResilientDatabaseBootstrap();
    const result = await bootstrap.initialize();
    
    return {
      bootstrapResult: result,
      databaseState: await this.getDatabaseState()
    };
  }

  async testScenario3_MultipleRestarts() {
    // Scénario 3: Redémarrages multiples
    console.log('🔄 Test de redémarrages multiples...');
    
    await this.resetDatabase();
    
    const results = [];
    
    // Premier démarrage
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    let bootstrap = new ResilientDatabaseBootstrap();
    let result1 = await bootstrap.initialize();
    results.push({ attempt: 1, result: result1 });
    
    // Deuxième démarrage (doit être idempotent)
    bootstrap = new ResilientDatabaseBootstrap();
    let result2 = await bootstrap.initialize();
    results.push({ attempt: 2, result: result2 });
    
    // Troisième démarrage
    bootstrap = new ResilientDatabaseBootstrap();
    let result3 = await bootstrap.initialize();
    results.push({ attempt: 3, result: result3 });
    
    return {
      restartResults: results,
      idempotent: result1.success && result2.success && result3.success,
      databaseState: await this.getDatabaseState()
    };
  }

  async testScenario4_ServerStartup() {
    // Scénario 4: Démarrage du serveur après bootstrap
    console.log('🚀 Test de démarrage du serveur...');
    
    await this.resetDatabase();
    
    // Bootstrap
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    const bootstrap = new ResilientDatabaseBootstrap();
    const bootstrapResult = await bootstrap.initialize();
    
    if (!bootstrapResult.success) {
      throw new Error('Bootstrap échoué, impossible de tester le serveur');
    }
    
    // Tester le démarrage du serveur (simulation)
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', ['src/server.js'], {
        env: { ...process.env, DB_AUTO_BOOTSTRAP: 'false' },
        stdio: 'pipe',
        timeout: 10000
      });
      
      let output = '';
      let hasStarted = false;
      
      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Serveur Event Planner Auth API démarré')) {
          hasStarted = true;
          console.log('✅ Serveur démarré avec succès');
          serverProcess.kill('SIGTERM');
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      serverProcess.on('exit', (code) => {
        if (hasStarted) {
          resolve({
            serverStarted: true,
            bootstrapResult,
            output: output.substring(0, 500) // Limiter la sortie
          });
        } else {
          reject(new Error(`Le serveur n\'a pas démarré. Code: ${code}`));
        }
      });
      
      // Timeout
      setTimeout(() => {
        if (!hasStarted) {
          serverProcess.kill('SIGKILL');
          reject(new Error('Timeout du démarrage du serveur'));
        }
      }, 10000);
    });
  }

  async testScenario5_ConcurrentBootstraps() {
    // Scénario 5: Bootstraps concurrents (test du verrou)
    console.log('🔒 Test de bootstraps concurrents...');
    
    await this.resetDatabase();
    
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    
    // Lancer deux bootstraps en parallèle
    const bootstrap1 = new ResilientDatabaseBootstrap();
    const bootstrap2 = new ResilientDatabaseBootstrap();
    
    const results = await Promise.allSettled([
      bootstrap1.initialize(),
      bootstrap2.initialize()
    ]);
    
    return {
      concurrentResults: results,
      lockWorking: results.some(r => r.status === 'fulfilled' && r.value.success) &&
                   results.some(r => r.status === 'rejected' || 
                                  (r.status === 'fulfilled' && !r.value.success))
    };
  }

  async resetDatabase() {
    const adminPool = new Pool({ ...config, database: 'postgres' });
    
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${config.database}`);
      await adminPool.query(`CREATE DATABASE ${config.database}`);
    } finally {
      await adminPool.end();
    }
  }

  async createPartialSchema() {
    const pool = new Pool(config);
    
    try {
      // Créer uniquement quelques tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS people (
          id BIGSERIAL PRIMARY KEY,
          first_name VARCHAR(255),
          email VARCHAR(255)
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          username VARCHAR(255),
          email VARCHAR(255)
        )
      `);
      
      console.log('✅ Schéma partiel créé');
    } finally {
      await pool.end();
    }
  }

  async getDatabaseState() {
    const pool = new Pool(config);
    
    try {
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      const result = await pool.query(tablesQuery);
      const tables = result.rows.map(row => row.table_name);
      
      // Vérifier l'utilisateur admin
      let adminExists = false;
      try {
        const adminQuery = 'SELECT COUNT(*) as count FROM users WHERE username = $1';
        const adminResult = await pool.query(adminQuery, ['admin']);
        adminExists = adminResult.rows[0].count > 0;
      } catch (e) {
        // La table users n'existe peut-être pas
      }
      
      return {
        tables,
        tableCount: tables.length,
        adminExists,
        migrations: await this.getMigrationCount(pool)
      };
    } finally {
      await pool.end();
    }
  }

  async getMigrationCount(pool) {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM schema_migrations');
      return result.rows[0].count;
    } catch (e) {
      return 0;
    }
  }

  async generateReport() {
    console.log('\n📊 RAPPORT DE TEST COMPLET');
    console.log('==========================');
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`\n📈 STATISTIQUES GLOBALES:`);
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Réussis: ${successfulTests}`);
    console.log(`   Échoués: ${failedTests}`);
    console.log(`   Taux de succès: ${((successfulTests/totalTests)*100).toFixed(1)}%`);
    
    console.log(`\n📋 DÉTAIL PAR TEST:`);
    for (const result of this.testResults) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.name} (${result.duration}ms)`);
      
      if (!result.success && result.error) {
        console.log(`      Erreur: ${result.error}`);
      }
    }
    
    // État final de la base
    console.log(`\n🗄️  ÉTAT FINAL DE LA BASE:`);
    const finalState = await this.getDatabaseState();
    console.log(`   Tables: ${finalState.tableCount}`);
    console.log(`   Admin existe: ${finalState.adminExists ? 'Oui' : 'Non'}`);
    console.log(`   Migrations: ${finalState.migrations}`);
    
    return {
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: failedTests,
        successRate: (successfulTests/totalTests)*100
      },
      tests: this.testResults,
      finalDatabaseState: finalState
    };
  }

  async runAllTests() {
    console.log('🧪 DÉMARRAGE DES TESTS DU BOOTSTRAP RÉSILIENT');
    console.log('=============================================');
    
    try {
      // Exécuter tous les scénarios de test
      await this.runTest('Base de données vide', () => this.testScenario1_EmptyDatabase());
      await this.runTest('Base de données partielle', () => this.testScenario2_PartialDatabase());
      await this.runTest('Redémarrages multiples', () => this.testScenario3_MultipleRestarts());
      await this.runTest('Démarrage du serveur', () => this.testScenario4_ServerStartup());
      await this.runTest('Bootstraps concurrents', () => this.testScenario5_ConcurrentBootstraps());
      
      // Générer le rapport final
      const report = await this.generateReport();
      
      // Sauvegarder le rapport
      await fs.writeFile(
        './bootstrap-test-report.json',
        JSON.stringify(report, null, 2)
      );
      
      console.log('\n📄 Rapport sauvegardé dans: bootstrap-test-report.json');
      
      return report;
      
    } catch (error) {
      console.error('\n💥 ERREUR CRITIQUE PENDANT LES TESTS:', error.message);
      throw error;
    }
  }
}

// Exécuter les tests si ce script est lancé directement
if (require.main === module) {
  const tester = new BootstrapTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 TESTS TERMINÉS');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 TESTS ÉCHOUÉS:', error.message);
      process.exit(1);
    });
}

module.exports = BootstrapTester;
