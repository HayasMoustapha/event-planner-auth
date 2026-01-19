#!/usr/bin/env node

/**
 * Script de Validation Post-Bootstrap
 * 
 * Valide que l'installation complète est fonctionnelle
 * et que tous les composants critiques sont opérationnels
 */

const { Pool } = require('pg');
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

class BootstrapValidator {
  constructor() {
    this.pool = new Pool(config);
    this.validationResults = [];
  }

  async validate() {
    console.log('🔍 Démarrage de la validation post-bootstrap...\n');

    try {
      // 1. Validation des tables
      await this.validateTables();
      
      // 2. Validation des contraintes
      await this.validateConstraints();
      
      // 3. Validation des données de base
      await this.validateBaseData();
      
      // 4. Validation des index
      await this.validateIndexes();
      
      // 5. Validation fonctionnelle
      await this.validateFunctionality();

      // Rapport final
      this.printValidationReport();

    } catch (error) {
      console.error('❌ Erreur critique lors de la validation:', error.message);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }

  async validateTables() {
    console.log('📋 Validation des tables...');
    const client = await this.pool.connect();
    
    try {
      const requiredTables = [
        'people', 'users', 'roles', 'permissions', 'menus',
        'accesses', 'authorizations', 'schema_migrations'
      ];

      for (const table of requiredTables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        const exists = result.rows[0].exists;
        this.addValidationResult(`Table ${table}`, exists, 
          exists ? `Table ${table} présente` : `❌ Table ${table} manquante`);
      }
      
    } finally {
      client.release();
    }
  }

  async validateConstraints() {
    console.log('⛓ Validation des contraintes...');
    const client = await this.pool.connect();
    
    try {
      // Vérifier les contraintes uniques critiques
      const constraints = [
        { table: 'people', column: 'email', name: 'people_email_key' },
        { table: 'users', column: 'email', name: 'users_email_key' },
        { table: 'roles', column: 'code', name: 'roles_code_key' },
        { table: 'permissions', column: 'code', name: 'permissions_code_key' }
      ];

      for (const constraint of constraints) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = $1
          )
        `, [constraint.name]);
        
        const exists = result.rows[0].exists;
        this.addValidationResult(`Contrainte ${constraint.name}`, exists,
          exists ? `Contrainte ${constraint.name} présente` : `❌ Contrainte ${constraint.name} manquante`);
      }
      
    } finally {
      client.release();
    }
  }

  async validateBaseData() {
    console.log('👥 Validation des données de base...');
    const client = await this.pool.connect();
    
    try {
      // Vérifier les rôles système
      const rolesResult = await client.query(`
        SELECT COUNT(*) as count FROM roles 
        WHERE is_system = true
      `);
      
      const systemRolesCount = rolesResult.rows[0].count;
      this.addValidationResult('Rôles système', systemRolesCount >= 5,
        `${systemRolesCount} rôles système trouvés`);

      // Vérifier l'administrateur par défaut
      const adminResult = await client.query(`
        SELECT COUNT(*) as count FROM users u
        JOIN people p ON u.person_id = p.id
        WHERE u.username = 'admin'
      `);

      const adminCount = adminResult.rows[0].count;
      this.addValidationResult('Admin par défaut', adminCount > 0,
        adminCount > 0 ? 'Admin par défaut présent' : '❌ Admin par défaut manquant');

      // Vérifier les permissions de base
      const permissionsResult = await client.query(`
        SELECT COUNT(*) as count FROM permissions
      `);

      const permissionsCount = permissionsResult.rows[0].count;
      this.addValidationResult('Permissions', permissionsCount >= 20,
        `${permissionsCount} permissions trouvées`);

      // Vérifier les authorizations pour super_admin
      const authResult = await client.query(`
        SELECT COUNT(*) as count FROM authorizations a
        JOIN roles r ON a.role_id = r.id
        WHERE r.code = 'super_admin'
      `);

      const authCount = authResult.rows[0].count;
      this.addValidationResult('Authorizations super_admin', authCount >= 10,
        `${authCount} authorizations pour super_admin`);

    } finally {
      client.release();
    }
  }

  async validateIndexes() {
    console.log('🔍 Validation des index...');
    const client = await this.pool.connect();
    
    try {
      const criticalIndexes = [
        'idx_people_email', 'idx_users_email', 'idx_roles_code',
        'idx_permissions_code', 'idx_schema_migrations_name'
      ];

      for (const indexName of criticalIndexes) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = $1
          )
        `, [indexName]);
        
        const exists = result.rows[0].exists;
        this.addValidationResult(`Index ${indexName}`, exists,
          exists ? `Index ${indexName} présent` : `❌ Index ${indexName} manquant`);
      }
      
    } finally {
      client.release();
    }
  }

  async validateFunctionality() {
    console.log('⚙️ Validation fonctionnelle...');
    const client = await this.pool.connect();
    
    try {
      // Test d'insertion (vérifier l'idempotence)
      await client.query('BEGIN');
      
      try {
        // Tenter d'insérer un rôle qui existe déjà
        await client.query(`
          INSERT INTO roles (code, label, "group", is_system, created_at, updated_at)
          VALUES ('test_role', '{"en": "Test"}', 'test', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (code) DO NOTHING
        `);
        
        await client.query('ROLLBACK');
        this.addValidationResult('Idempotence des INSERT', true, 'INSERT idempotent fonctionnel');
        
      } catch (error) {
        await client.query('ROLLBACK');
        this.addValidationResult('Idempotence des INSERT', false, `❌ Erreur: ${error.message}`);
      }

      // Test de sélection
      const selectResult = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE status = 'active'
      `);
      
      const activeUsersCount = selectResult.rows[0].count;
      this.addValidationResult('Requêtes SELECT', activeUsersCount >= 0,
        `${activeUsersCount} utilisateurs actifs`);

    } finally {
      client.release();
    }
  }

  addValidationResult(test, success, message) {
    this.validationResults.push({
      test,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  printValidationReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE VALIDATION POST-BOOTSTRAP');
    console.log('='.repeat(60));
    
    const totalTests = this.validationResults.length;
    const successfulTests = this.validationResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`\n📈 Statistiques:`);
    console.log(`   Total des validations: ${totalTests}`);
    console.log(`   Réussies: ${successfulTests} ✅`);
    console.log(`   Échouées: ${failedTests} ❌`);
    console.log(`   Taux de réussite: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Détails:`);
    this.validationResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.test}: ${result.message}`);
    });
    
    if (failedTests === 0) {
      console.log('\n🎉 TOUTES LES VALIDATIONS SONT PASSÉES - BOOTSTRAP PARFAIT!');
    } else {
      console.log('\n⚠️ CERTAINES VALIDATIONS ONT ÉCHOUÉ - VÉRIFICATIONS NÉCESSAIRES');
      process.exit(1);
    }
  }
}

// Exécuter la validation
if (require.main === module) {
  const validator = new BootstrapValidator();
  validator.validate().catch(console.error);
}

module.exports = BootstrapValidator;
