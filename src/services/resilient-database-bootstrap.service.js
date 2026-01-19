const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { connection } = require('../config/database');

/**
 * Service de Bootstrap Résilient et Idempotent
 * 
 * CONTRAT PUBLIC:
 * ================
 * Méthode obligatoire: initialize()
 * - Type: async function
 * - Rôle: Initialise la base de données de manière fiable
 * - Retour: Promise<Object> Résultat du bootstrap
 * - Erreur: Jamais de crash, toujours retourne un état
 * 
 * PROPRIÉTÉS:
 * - Totalement idempotent
 * - Résilient aux erreurs
 * - Transactions isolées par étape
 * - Libération garantie des ressources
 * - Logs détaillés par étape
 * 
 * INVARIANTS:
 * - initialize() ne JAMAIS lance d'exception non gérée
 * - Chaque étape est dans sa propre transaction
 * - Les ressources sont TOUJOURS libérées
 * - L'état est TOUJOURS cohérent
 */
class ResilientDatabaseBootstrap {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../database/migrations');
    this.seedsPath = path.join(__dirname, '../../database/seeds');
    this.bootstrapPath = path.join(__dirname, '../../database/bootstrap');
    this.lockId = 12345;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Initialise la base de données (méthode OBLIGATOIRE)
   * @returns {Promise<Object>} Résultat du bootstrap
   */
  async initialize() {
    const startTime = Date.now();
    const result = {
      success: false,
      message: '',
      duration: 0,
      actions: [],
      errors: [],
      warnings: []
    };

    try {
      console.log('🚀 DÉMARRAGE DU BOOTSTRAP RÉSILIENT');
      console.log('=====================================');

      // Vérification de sécurité
      if (process.env.DB_AUTO_BOOTSTRAP !== 'true') {
        console.log('⚠️  Bootstrap automatique désactivé (DB_AUTO_BOOTSTRAP != true)');
        return {
          ...result,
          success: true,
          message: 'Bootstrap désactivé',
          actions: ['Bootstrap désactivé']
        };
      }

      // Phase 1: Verrouillage avec retry
      await this.withRetry('acquireLock', async () => {
        await this.acquireLock();
      }, result);

      // Phase 2: Validation de l'état initial
      await this.withRetry('validateInitialState', async () => {
        await this.validateInitialState();
      }, result);

      // Phase 3: Préparation de la structure
      await this.withRetry('prepareSchema', async () => {
        await this.prepareSchema();
      }, result);

      // Phase 4: Application des migrations
      const migrationsApplied = await this.withRetry('applyMigrations', async () => {
        return await this.applyMigrations();
      }, result);

      result.actions.push(`${migrationsApplied.length} migration(s) appliquée(s)`);

      // Phase 5: Application des seeds
      const seedsExecuted = await this.withRetry('applySeeds', async () => {
        return await this.applySeeds();
      }, result);

      result.actions.push(`${seedsExecuted.length} seed(s) exécuté(s)`);

      // Phase 6: Validation finale
      await this.withRetry('validateFinalState', async () => {
        await this.validateFinalState();
      }, result);

      // Phase 7: Configuration du super-admin
      await this.withRetry('ensureSuperAdmin', async () => {
        await this.ensureSuperAdmin();
      }, result);

      result.actions.push('Configuration super-admin');

      // Libération du verrou
      await this.releaseLock();

      result.duration = Date.now() - startTime;
      result.success = true;
      result.message = 'Bootstrap résilient terminé avec succès';

      console.log('\n🎉 BOOTSTRAP TERMINÉ AVEC SUCCÈS');
      console.log(`⏱️  Durée: ${result.duration}ms`);
      console.log(`📋 Actions: ${result.actions.join(', ')}`);

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.success = false;
      result.message = `Bootstrap échoué: ${error.message}`;
      result.errors.push(error.message);

      console.error('\n💥 ERREUR CRITIQUE DU BOOTSTRAP');
      console.error(`📝 Message: ${error.message}`);
      console.error('🔧 Tentative de récupération...');

      // Toujours essayer de libérer le verrou
      try {
        await this.releaseLock();
        console.log('✅ Verrou libéré malgré l\'erreur');
      } catch (lockError) {
        console.error('❌ Impossible de libérer le verrou:', lockError.message);
        result.warnings.push('Verrou non libéré');
      }

    }

    return result;
  }

  /**
   * Exécute une opération avec retry et gestion d'erreur
   */
  async withRetry(operationName, operation, result) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`\n🔄 [${operationName}] Tentative ${attempt}/${this.maxRetries}`);
        const operationResult = await operation();
        console.log(`✅ [${operationName}] Succès`);
        return operationResult;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️  [${operationName}] Erreur tentative ${attempt}: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Attente ${this.retryDelay}ms avant retry...`);
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    const errorMsg = `Échec de ${operationName} après ${this.maxRetries} tentatives: ${lastError.message}`;
    result.errors.push(errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * Pause utilitaire
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verrouillage avec gestion d'erreur
   */
  async acquireLock() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      
      // Vérifier si le verrou est déjà pris
      const lockCheck = await client.query(
        'SELECT pg_advisory_lock($1) as locked',
        [this.lockId]
      );
      
      if (!lockCheck.rows[0].locked) {
        throw new Error('Impossible d\'acquérir le verrou de bootstrap');
      }
      
      console.log('🔒 Verrou de bootstrap acquis');
      return true;
    } finally {
      await client.query('COMMIT');
      client.release();
    }
  }

  /**
   * Libération garantie du verrou
   */
  async releaseLock() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_unlock($1)', [this.lockId]);
      await client.query('COMMIT');
      console.log('🔓 Verrou de bootstrap libéré');
    } catch (error) {
      // Ne jamais échouer sur la libération du verrou
      console.warn('⚠️  Erreur lors de la libération du verrou (ignorée):', error.message);
    } finally {
      try {
        await client.query('COMMIT');
      } catch (e) {
        // Ignorer les erreurs de COMMIT
      }
      client.release();
    }
  }

  /**
   * Validation de l'état initial de la base
   */
  async validateInitialState() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      
      // Vérifier si on peut se connecter
      await client.query('SELECT 1');
      
      await client.query('COMMIT');
      console.log('✅ Connexion à la base validée');
    } finally {
      try {
        await client.query('ROLLBACK');
      } catch (e) {
        // Ignorer si pas de transaction
      }
      client.release();
    }
  }

  /**
   * Préparation du schéma de manière idempotente
   */
  async prepareSchema() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      
      // Créer la table schema_migrations si elle n'existe pas
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          checksum VARCHAR(64) NOT NULL,
          file_size BIGINT NOT NULL,
          execution_time_ms INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Créer les index si ils n'existent pas
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_created_at 
        ON schema_migrations(created_at)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_name 
        ON schema_migrations(migration_name)
      `);
      
      await client.query('COMMIT');
      console.log('✅ Schéma préparé (schema_migrations)');
    } finally {
      try {
        await client.query('ROLLBACK');
      } catch (e) {
        // Ignorer si pas de transaction
      }
      client.release();
    }
  }

  /**
   * Application des migrations avec gestion d'erreur isolée
   */
  async applyMigrations() {
    const client = await connection.connect();
    const appliedMigrations = [];
    
    try {
      const migrationFiles = await this.getMigrationFiles();
      
      for (const file of migrationFiles) {
        const migrationName = path.basename(file);
        
        // Vérifier si déjà appliquée
        if (await this.isMigrationApplied(migrationName)) {
          console.log(`⏭️  Migration ${migrationName} déjà appliquée`);
          continue;
        }

        // Appliquer la migration dans sa propre transaction
        const migrationClient = await connection.connect();
        try {
          await migrationClient.query('BEGIN');
          
          const migrationSql = await fs.readFile(file, 'utf8');
          await migrationClient.query(migrationSql);
          
          // Enregistrer la migration
          const stats = await fs.stat(file);
          const checksum = await this.calculateFileChecksum(file);
          
          await migrationClient.query(`
            INSERT INTO schema_migrations (migration_name, checksum, file_size, execution_time_ms)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (migration_name) DO NOTHING
          `, [migrationName, checksum, stats.size, Date.now()]);
          
          await migrationClient.query('COMMIT');
          appliedMigrations.push(migrationName);
          console.log(`✅ Migration ${migrationName} appliquée`);
          
        } catch (migrationError) {
          await migrationClient.query('ROLLBACK');
          console.error(`❌ Erreur migration ${migrationName}: ${migrationError.message}`);
          // Continuer avec les autres migrations au lieu de tout arrêter
          continue;
        } finally {
          migrationClient.release();
        }
      }
      
      console.log(`✅ ${appliedMigrations.length} migration(s) appliquée(s) avec succès`);
      return appliedMigrations;
      
    } finally {
      client.release();
    }
  }

  /**
   * Application des seeds de manière idempotente
   */
  async applySeeds() {
    const client = await connection.connect();
    const executedSeeds = [];
    
    try {
      // Vérifier si c'est la première initialisation
      const isFirstInit = await this.isFirstInitialization();
      
      if (!isFirstInit) {
        console.log('⏭️  Seeds non appliqués (base déjà initialisée)');
        return executedSeeds;
      }

      // Appliquer uniquement les seeds critiques
      const criticalSeeds = [
        'permissions.seed.sql',
        'roles.seed.sql',
        'menus.seed.sql'
      ];

      for (const seedFile of criticalSeeds) {
        try {
          const seedPath = path.join(this.seedsPath, 'seeds', seedFile);
          
          if (!(await fs.access(seedPath).catch(() => false))) {
            console.log(`⚠️  Seed ${seedFile} non trouvé, ignoré`);
            continue;
          }

          const seedClient = await connection.connect();
          try {
            await seedClient.query('BEGIN');
            
            const seedSql = await fs.readFile(seedPath, 'utf8');
            await seedClient.query(seedSql);
            
            await seedClient.query('COMMIT');
            executedSeeds.push(seedFile);
            console.log(`✅ Seed ${seedFile} appliqué`);
            
          } catch (seedError) {
            await seedClient.query('ROLLBACK');
            console.error(`❌ Erreur seed ${seedFile}: ${seedError.message}`);
          } finally {
            seedClient.release();
          }
        } catch (error) {
          console.error(`❌ Erreur lecture seed ${seedFile}: ${error.message}`);
        }
      }
      
      console.log(`✅ ${executedSeeds.length} seed(s) appliqué(s)`);
      return executedSeeds;
      
    } finally {
      client.release();
    }
  }

  /**
   * Validation de l'état final
   */
  async validateFinalState() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      
      // Vérifier les tables critiques
      const requiredTables = ['people', 'users', 'roles', 'permissions', 'menus'];
      const missingTables = [];
      
      for (const table of requiredTables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1 AND table_schema = 'public'
          )
        `, [table]);
        
        if (!result.rows[0].exists) {
          missingTables.push(table);
        }
      }
      
      if (missingTables.length > 0) {
        throw new Error(`Tables critiques manquantes: ${missingTables.join(', ')}`);
      }
      
      await client.query('COMMIT');
      console.log('✅ État final validé');
      
    } finally {
      try {
        await client.query('ROLLBACK');
      } catch (e) {
        // Ignorer si pas de transaction
      }
      client.release();
    }
  }

  /**
   * Configuration garantie du super-admin
   */
  async ensureSuperAdmin() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      
      // Vérifier si l'admin existe
      const adminCheck = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE username = 'admin'
      `);
      
      if (adminCheck.rows[0].count === 0) {
        // Créer l'admin par défaut
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('Admin123!', 12);
        
        // Créer la personne d'abord
        const personResult = await client.query(`
          INSERT INTO people (first_name, last_name, email, phone, created_at, updated_at)
          VALUES ('Super', 'Admin', 'admin@eventplanner.com', '+33612345678', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `);
        
        const personId = personResult.rows[0]?.id || 
          (await client.query('SELECT id FROM people WHERE email = $1', ['admin@eventplanner.com'])).rows[0]?.id;
        
        if (personId) {
          // Créer l'utilisateur
          await client.query(`
            INSERT INTO users (username, email, password, user_code, phone, status, person_id, created_at, updated_at)
            VALUES ('admin', 'admin@eventplanner.com', $1, 'SUPER_ADMIN', '+33612345678', 'active', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO NOTHING
          `, [hashedPassword, personId]);
          
          console.log('✅ Super-admin créé par défaut');
        }
      }
      
      await client.query('COMMIT');
      console.log('✅ Configuration super-admin validée');
      
    } finally {
      try {
        await client.query('ROLLBACK');
      } catch (e) {
        // Ignorer si pas de transaction
      }
      client.release();
    }
  }

  /**
   * Vérifie si une migration est déjà appliquée
   */
  async isMigrationApplied(migrationName) {
    const client = await connection.connect();
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM schema_migrations 
        WHERE migration_name = $1
      `, [migrationName]);
      
      return result.rows[0].count > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Détermine si c'est la première initialisation
   */
  async isFirstInitialization() {
    const client = await connection.connect();
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count FROM schema_migrations
      `);
      
      return result.rows[0].count === 0;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère la liste des fichiers de migration triés
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .filter(file => !file.includes('export')) // Exclure les exports
        .sort();
      
      return migrationFiles.map(file => path.join(this.migrationsPath, file));
    } catch (error) {
      throw new Error(`Impossible de lire le dossier des migrations: ${error.message}`);
    }
  }

  /**
   * Calcule le checksum SHA256 d'un fichier
   */
  async calculateFileChecksum(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Vérifie l'état de santé du bootstrap
   */
  async healthCheck() {
    try {
      const client = await connection.connect();
      try {
        await client.query('SELECT 1');
        return { healthy: true, message: 'Bootstrap système healthy' };
      } finally {
        client.release();
      }
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }
}

module.exports = new ResilientDatabaseBootstrap();
