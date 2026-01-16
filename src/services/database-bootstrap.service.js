const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { connection } = require('../config/database');

/**
 * Service de Bootstrap de Base de Données
 * Gère l'initialisation automatique et sécurisée de la base de données
 */
class DatabaseBootstrap {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../database/migrations');
    this.seedsPath = path.join(__dirname, '../../database/seeds');
    this.bootstrapPath = path.join(__dirname, '../../database/bootstrap');
    this.lockId = 12345; // ID unique pour le verrou PostgreSQL
  }

  /**
   * Point d'entrée principal du bootstrap
   */
  async initialize() {
    try {
      // Vérification de sécurité : le bootstrap doit être explicitement activé
      if (process.env.DB_AUTO_BOOTSTRAP !== 'true') {
        console.log('⚠️  Bootstrap automatique désactivé (DB_AUTO_BOOTSTRAP != true)');
        return { success: true, message: 'Bootstrap désactivé', actions: [] };
      }

      console.log('🚀 Démarrage du bootstrap de la base de données...');
      const startTime = Date.now();
      const actions = [];

      // Phase 1: Connexion et verrouillage
      await this.acquireLock();
      actions.push('Verrouillage de la base de données');

      // Phase 2: Création de la table de contrôle
      await this.createSchemaMigrationsTable();
      actions.push('Création de la table schema_migrations');

      // Phase 3: Application des migrations
      const migrationsApplied = await this.applyMigrations();
      actions.push(`Application de ${migrationsApplied.length} migration(s)`);

      // Phase 4: Exécution des seeds si nécessaire
      const seedsExecuted = await this.executeSeeds();
      actions.push(`Exécution de ${seedsExecuted.length} seed(s)`);

      // Phase 5: Validation finale
      await this.validateInstallation();
      actions.push('Validation de l\'installation');

      // Phase 6: Garantir les permissions super-admin
      await this.ensureSuperAdminPermissions();
      actions.push('Garantie des permissions super-admin');

      await this.releaseLock();

      const duration = Date.now() - startTime;
      console.log(`✅ Bootstrap terminé en ${duration}ms`);

      return {
        success: true,
        message: 'Bootstrap réussi',
        duration,
        actions,
        migrationsApplied: migrationsApplied.length,
        seedsExecuted: seedsExecuted.length
      };

    } catch (error) {
      await this.releaseLock();
      console.error('❌ Erreur lors du bootstrap:', error.message);
      throw error;
    }
  }

  /**
   * Acquiert un verrou PostgreSQL pour éviter les exécutions simultanées
   */
  async acquireLock() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT pg_advisory_lock($1)', [this.lockId]);
      console.log('🔒 Verrou de bootstrap acquis');
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Libère le verrou PostgreSQL
   */
  async releaseLock() {
    const client = await connection.connect();
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [this.lockId]);
      console.log('🔓 Verrou de bootstrap libéré');
    } finally {
      client.release();
    }
  }

  /**
   * Crée la table de contrôle schema_migrations si elle n'existe pas
   */
  async createSchemaMigrationsTable() {
    const client = await connection.connect();
    try {
      const bootstrapSql = await fs.readFile(
        path.join(this.bootstrapPath, '001_create_schema_migrations.sql'),
        'utf8'
      );
      await client.query(bootstrapSql);
      console.log('✅ Table schema_migrations vérifiée/créée');
    } finally {
      client.release();
    }
  }

  /**
   * Applique les migrations en attente
   */
  async applyMigrations() {
    const client = await connection.connect();
    const appliedMigrations = [];

    try {
      // Récupérer les fichiers de migration dans l'ordre
      const migrationFiles = await this.getMigrationFiles();
      
      for (const file of migrationFiles) {
        const migrationName = path.basename(file);
        
        // Vérifier si la migration est déjà appliquée
        const isApplied = await this.isMigrationApplied(migrationName);
        if (isApplied) {
          console.log(`⏭️  Migration ${migrationName} déjà appliquée`);
          continue;
        }

        // Appliquer la migration
        const startTime = Date.now();
        await client.query('BEGIN');
        
        try {
          const migrationSql = await fs.readFile(file, 'utf8');
          await client.query(migrationSql);
          
          // Calculer le checksum et enregistrer la migration
          const stats = await fs.stat(file);
          const checksum = await this.calculateFileChecksum(file);
          
          await client.query(`
            INSERT INTO schema_migrations (migration_name, checksum, file_size, execution_time_ms)
            VALUES ($1, $2, $3, $4)
          `, [migrationName, checksum, stats.size, Date.now() - startTime]);
          
          await client.query('COMMIT');
          appliedMigrations.push(migrationName);
          console.log(`✅ Migration ${migrationName} appliquée`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw new Error(`Erreur lors de la migration ${migrationName}: ${error.message}`);
        }
      }
    } finally {
      client.release();
    }

    return appliedMigrations;
  }

  /**
   * Exécute les seeds si la base vient d'être initialisée
   */
  async executeSeeds() {
    // Vérifier si c'est la première initialisation
    const isFirstInit = await this.isFirstInitialization();
    if (!isFirstInit) {
      console.log('⏭️  Seeds non nécessaires (base déjà initialisée)');
      return [];
    }

    const client = await connection.connect();
    const executedSeeds = [];

    try {
      // Ordre strict d'exécution des seeds
      const seedOrder = [
        'roles.seed.sql',
        'permissions.seed.sql', 
        'menus.seed.sql',
        'admin.seed.sql'
      ];

      for (const seedFile of seedOrder) {
        const seedPath = path.join(this.seedsPath, 'seeds', seedFile);
        
        try {
          await fs.access(seedPath);
        } catch {
          console.warn(`⚠️  Fichier seed non trouvé: ${seedFile}`);
          continue;
        }

        const startTime = Date.now();
        await client.query('BEGIN');
        
        try {
          const seedSql = await fs.readFile(seedPath, 'utf8');
          await client.query(seedSql);
          await client.query('COMMIT');
          
          executedSeeds.push(seedFile);
          console.log(`✅ Seed ${seedFile} exécuté`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw new Error(`Erreur lors du seed ${seedFile}: ${error.message}`);
        }
      }
    } finally {
      client.release();
    }

    return executedSeeds;
  }

  /**
   * Valide l'installation complète
   */
  async validateInstallation() {
    const client = await connection.connect();
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
          throw new Error(`Table critique manquante: ${table}`);
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

      console.log('✅ Validation de l\'installation réussie');
      
    } finally {
      client.release();
    }
  }

  /**
   * Récupère la liste des fichiers de migration triés par nom
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => path.join(this.migrationsPath, file));
      
      return migrationFiles;
    } catch (error) {
      throw new Error(`Impossible de lire le dossier des migrations: ${error.message}`);
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
      // Si aucune migration n'est appliquée, c'est la première fois
      const result = await client.query(`
        SELECT COUNT(*) as count FROM schema_migrations
      `);
      
      return result.rows[0].count === 0;
    } finally {
      client.release();
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
   * Retourne l'état actuel des migrations
   */
  async getMigrationStatus() {
    const client = await connection.connect();
    try {
      const result = await client.query(`
        SELECT migration_name, executed_at, checksum, file_size, execution_time_ms
        FROM schema_migrations 
        ORDER BY executed_at
      `);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Garantit que le super-admin ait toutes les permissions disponibles
   */
  async ensureSuperAdminPermissions() {
    const client = await connection.connect();
    try {
      await client.query('BEGIN');

      // Récupérer le rôle super_admin
      const roleResult = await client.query(`
        SELECT id FROM roles WHERE code = 'super_admin'
      `);

      if (roleResult.rows.length === 0) {
        console.log('⚠️  Rôle super_admin non trouvé, création des permissions ignorée');
        return;
      }

      const superAdminRoleId = roleResult.rows[0].id;

      // Récupérer toutes les permissions
      const permissionsResult = await client.query(`
        SELECT id FROM permissions
      `);

      // Insérer toutes les permissions manquantes pour le super_admin
      for (const permission of permissionsResult.rows) {
        await client.query(`
          INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
          VALUES ($1, $2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING
        `, [superAdminRoleId, permission.id]);
      }

      await client.query('COMMIT');
      console.log(`✅ Super-admin permissions garanties: ${permissionsResult.rows.length} permissions`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erreur lors de la garantie des permissions super-admin:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseBootstrap;
