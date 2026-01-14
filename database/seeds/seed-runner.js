#!/usr/bin/env node

/**
 * ========================================
 * 🌱 SCRIPT D'EXÉCUTION DES SEEDS RBAC
 * ========================================
 * Script Node.js pour exécuter les seeds du système RBAC
 * Compatible avec PostgreSQL et Node.js
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class SeedRunner {
    constructor() {
        // Configuration de la base de données
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'event_planner_auth',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });

        // Configuration des seeds
        this.seedFiles = [
            { name: 'Rôles', file: 'roles.seed.sql', step: 1 },
            { name: 'Permissions', file: 'permissions.seed.sql', step: 2 },
            { name: 'Menus', file: 'menus.seed.sql', step: 3 },
            { name: 'Administrateur', file: 'admin.seed.sql', step: 4 }
        ];

        this.seedPath = path.join(__dirname, 'seeds');
    }

    /**
     * Affiche un message avec formatage
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            start: '🚀',
            step: '📋',
            database: '🗄️'
        };

        console.log(`${icons[type]} [${timestamp}] ${message}`);
    }

    /**
     * Lit le contenu d'un fichier SQL
     */
    async readSqlFile(filename) {
        try {
            const filePath = path.join(this.seedPath, filename);
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`Impossible de lire le fichier ${filename}: ${error.message}`);
        }
    }

    /**
     * Exécute une requête SQL
     */
    async executeQuery(sql, description = 'Requête SQL') {
        const client = await this.pool.connect();
        try {
            this.log(`Exécution: ${description}`, 'database');
            const result = await client.query(sql);
            return result;
        } catch (error) {
            throw new Error(`Erreur lors de l'exécution de ${description}: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Exécute un fichier SQL de seed
     */
    async executeSeed(seedFile) {
        try {
            this.log(`Étape ${seedFile.step}/4: Exécution du seed ${seedFile.name}...`, 'step');
            
            const sql = await this.readSqlFile(seedFile.file);
            
            // Démarrer une transaction pour ce seed
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');
                
                // Exécuter le SQL du seed
                await client.query(sql);
                
                // Valider la transaction
                await client.query('COMMIT');
                
                this.log(`Seed ${seedFile.name} exécuté avec succès`, 'success');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            this.log(`Erreur lors de l'exécution du seed ${seedFile.name}: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Vérifie l'état de la base de données
     */
    async checkDatabaseStatus() {
        try {
            this.log('Vérification de la connexion à la base de données...', 'database');
            
            // Test de connexion
            await this.executeQuery('SELECT 1', 'Test de connexion');
            
            // Vérification des tables
            const tablesResult = await this.executeQuery(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('roles', 'permissions', 'menus', 'users', 'people')
                ORDER BY table_name
            `, 'Vérification des tables');
            
            const tables = tablesResult.rows.map(row => row.table_name);
            
            if (tables.length >= 5) {
                this.log(`Base de données OK: ${tables.length} tables trouvées`, 'success');
                return true;
            } else {
                this.log(`Attention: Seulement ${tables.length}/5 tables trouvées`, 'warning');
                return false;
            }
        } catch (error) {
            this.log(`Erreur de connexion à la base de données: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Affiche les statistiques finales
     */
    async showFinalStatistics() {
        try {
            this.log('Génération du rapport final...', 'info');
            
            const stats = await this.executeQuery(`
                SELECT 
                    (SELECT COUNT(*) FROM roles WHERE is_active = true) as roles_count,
                    (SELECT COUNT(*) FROM permissions WHERE is_active = true) as permissions_count,
                    (SELECT COUNT(*) FROM menus WHERE is_active = true) as menus_count,
                    (SELECT COUNT(*) FROM users WHERE is_active = true) as users_count,
                    (SELECT COUNT(*) FROM user_roles) as user_roles_count,
                    (SELECT COUNT(*) FROM role_permissions) as role_permissions_count,
                    (SELECT COUNT(*) FROM role_menus) as role_menus_count
            `, 'Statistiques finales');
            
            const s = stats.rows[0];
            
            console.log('\n📊 RAPPORT FINAL DU SYSTÈME RBAC');
            console.log('='.repeat(50));
            console.log(`👥 Utilisateurs: ${s.users_count}`);
            console.log(`🛡️  Rôles: ${s.roles_count}`);
            console.log(`🔑 Permissions: ${s.permissions_count}`);
            console.log(`📋 Menus: ${s.menus_count}`);
            console.log(`🔗 Associations utilisateur-rôle: ${s.user_roles_count}`);
            console.log(`🔗 Associations rôle-permission: ${s.role_permissions_count}`);
            console.log(`🔗 Associations rôle-menu: ${s.role_menus_count}`);
            console.log('='.repeat(50));
            
            // Vérification de l'administrateur
            const adminResult = await this.executeQuery(`
                SELECT u.id, u.username, u.email, r.name as role_name
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                WHERE u.username = 'admin'
            `, 'Vérification administrateur');
            
            if (adminResult.rows.length > 0) {
                const admin = adminResult.rows[0];
                console.log('\n👤 ADMINISTRATEUR CRÉÉ:');
                console.log(`📧 Email: ${admin.email}`);
                console.log(`🔑 Username: ${admin.username}`);
                console.log(`🛡️  Rôle: ${admin.role_name}`);
                console.log(`🔐 Mot de passe: admin123`);
                console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion!');
            }
            
            return true;
        } catch (error) {
            this.log(`Erreur lors de la génération du rapport: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Fonction principale d'exécution
     */
    async run() {
        console.log('🌱 DÉMARRAGE DES SEEDS RBAC');
        console.log('='.repeat(50));
        
        const startTime = Date.now();
        
        try {
            // Étape 0: Vérification de la base de données
            const dbReady = await this.checkDatabaseStatus();
            if (!dbReady) {
                this.log('La base de données n\'est pas prête. Arrêt du processus.', 'error');
                process.exit(1);
            }
            
            // Exécuter tous les seeds
            let successCount = 0;
            for (const seedFile of this.seedFiles) {
                const success = await this.executeSeed(seedFile);
                if (success) {
                    successCount++;
                } else {
                    this.log(`Arrêt du processus suite à l'échec du seed ${seedFile.name}`, 'error');
                    break;
                }
            }
            
            // Afficher les statistiques finales
            if (successCount === this.seedFiles.length) {
                await this.showFinalStatistics();
                
                const duration = Math.round((Date.now() - startTime) / 1000);
                console.log(`\n🎉 TOUS LES SEEDS ONT ÉTÉ EXÉCUTÉS AVEC SUCCÈS! (${duration}s)`);
                console.log('🚀 Le système RBAC est prêt à être utilisé');
                
                process.exit(0);
            } else {
                this.log(`Seulement ${successCount}/${this.seedFiles.length} seeds ont été exécutés`, 'error');
                process.exit(1);
            }
            
        } catch (error) {
            this.log(`Erreur critique lors de l'exécution des seeds: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    /**
     * Nettoyage des ressources
     */
    async cleanup() {
        await this.pool.end();
    }
}

// Gestionnaire d'arrêt propre
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du processus demandé...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Terminaison du processus...');
    process.exit(0);
});

// Exécution principale
if (require.main === module) {
    const seedRunner = new SeedRunner();
    
    seedRunner.run().catch(error => {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    }).finally(() => {
        seedRunner.cleanup();
    });
}

module.exports = SeedRunner;
