#!/usr/bin/env node

/**
 * ========================================
 * 🌱 SCRIPT D'EXÉCUTION DES SEEDS POSTGRESQL
 * ========================================
 * Script Node.js pour exécuter les seeds du système RBAC
 * Compatible avec PostgreSQL et le schéma actuel
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class SeedExecutor {
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
        this.seedSteps = [
            { name: 'Rôles', file: 'roles_simple.seed.sql', description: 'Création des rôles système' },
            { name: 'Permissions', file: 'permissions_simple.seed.sql', description: 'Création des permissions système' },
            { name: 'Menus', file: 'menus_simple.seed.sql', description: 'Création des menus système' },
            { name: 'Administrateur', file: 'admin_simple.seed.sql', description: 'Création du compte administrateur' }
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
            step: '📋'
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
    async query(sql, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return result;
        } finally {
            client.release();
        }
    }

    /**
     * Exécute un fichier SQL complet
     */
    async executeSqlFile(filename) {
        const sqlContent = await this.readSqlFile(filename);
        
        // Diviser le contenu en instructions individuelles
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await client.query(statement);
                    } catch (error) {
                        // Ignorer les erreurs de DO blocks qui s'affichent comme des notices
                        if (!error.message.includes('RAISE NOTICE')) {
                            throw error;
                        }
                    }
                }
            }
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Vérifie le résultat d'un seed
     */
    async verifySeed(stepName) {
        const verifications = {
            'Rôles': 'SELECT COUNT(*) FROM roles',
            'Permissions': 'SELECT COUNT(*) FROM permissions',
            'Menus': 'SELECT COUNT(*) FROM menus',
            'Administrateur': 'SELECT COUNT(*) FROM users WHERE username = \'admin\''
        };

        const query = verifications[stepName];
        if (!query) return 0;

        const result = await this.query(query);
        return parseInt(result.rows[0].count);
    }

    /**
     * Exécute tous les seeds
     */
    async executeAllSeeds() {
        this.log('🚀 Démarrage du processus de seeds PostgreSQL...', 'start');
        this.log('📋 Étapes prévues: Rôles → Permissions → Menus → Administrateur', 'info');
        this.log(`⏰ Heure de début: ${new Date().toLocaleString()}`, 'info');

        const client = await this.pool.connect();
        
        try {
            // Démarrer une transaction globale
            await client.query('BEGIN');

            // Exécuter chaque étape
            for (let i = 0; i < this.seedSteps.length; i++) {
                const step = this.seedSteps[i];
                
                this.log('', 'info');
                this.log(`📋 ÉTAPE ${i + 1}/${this.seedSteps.length}: ${step.description}...`, 'step');
                
                try {
                    // Lire et exécuter le fichier SQL
                    const sqlContent = await this.readSqlFile(step.file);
                    
                    // Nettoyer le contenu SQL pour l'exécution directe
                    const cleanedSql = sqlContent
                        .replace(/--.*$/gm, '') // Supprimer les commentaires
                        .split(';')
                        .map(stmt => stmt.trim())
                        .filter(stmt => stmt.length > 0 && !stmt.startsWith('DO'))
                        .join(';\n');

                    if (cleanedSql.trim()) {
                        await client.query(cleanedSql);
                    }
                    
                    // Vérifier le résultat
                    const count = await this.verifySeed(step.name);
                    this.log(`✅ ${step.name} créés: ${count} enregistrements`, 'success');
                    
                    if (count === 0) {
                        throw new Error(`Aucun ${step.name.toLowerCase()} n'a été créé`);
                    }
                    
                } catch (error) {
                    this.log(`❌ Erreur lors de l'étape ${step.name}: ${error.message}`, 'error');
                    throw error;
                }
            }

            // Valider la transaction
            await client.query('COMMIT');
            
            // Afficher le résumé final
            await this.showFinalSummary();
            
            this.log('', 'info');
            this.log('🎉 PROCESSUS DE SEED TERMINÉ AVEC SUCCÈS!', 'success');
            this.log(`⏰ Heure de fin: ${new Date().toLocaleString()}`, 'info');
            this.log('🚀 Le système RBAC est prêt à être utilisé', 'success');
            
        } catch (error) {
            await client.query('ROLLBACK');
            this.log(`❌ Erreur critique: ${error.message}`, 'error');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Affiche le résumé final
     */
    async showFinalSummary() {
        const queries = {
            users: 'SELECT COUNT(*) FROM users',
            roles: 'SELECT COUNT(*) FROM roles',
            permissions: 'SELECT COUNT(*) FROM permissions',
            menus: 'SELECT COUNT(*) FROM menus',
            accesses: 'SELECT COUNT(*) FROM accesses'
        };

        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            const result = await this.query(query);
            results[key] = parseInt(result.rows[0].count);
        }

        this.log('', 'info');
        this.log('📊 RÉSUMÉ DU SYSTÈME RBAC', 'info');
        this.log('================================', 'info');
        this.log(`👥 Utilisateurs: ${results.users}`, 'info');
        this.log(`🛡️  Rôles: ${results.roles}`, 'info');
        this.log(`🔑 Permissions: ${results.permissions}`, 'info');
        this.log(`📋 Menus: ${results.menus}`, 'info');
        this.log(`🔗 Accès utilisateur-rôle: ${results.accesses}`, 'info');
        this.log('================================', 'info');

        // Informations de connexion
        this.log('', 'info');
        this.log('🔐 INFORMATIONS DE CONNEXION', 'info');
        this.log('================================', 'info');
        this.log('📧 Email: admin@eventplanner.com', 'info');
        this.log('🔑 Mot de passe: admin123', 'info');
        this.log('👤 Nom d\'utilisateur: admin', 'info');
        this.log('🛡️  Rôle: super_admin', 'info');
        this.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion!', 'warning');
        this.log('================================', 'info');
    }

    /**
     * Nettoyage des ressources
     */
    async cleanup() {
        await this.pool.end();
    }
}

// Exécution principale
async function main() {
    const executor = new SeedExecutor();
    
    try {
        await executor.executeAllSeeds();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution des seeds:', error.message);
        process.exit(1);
    } finally {
        await executor.cleanup();
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    main();
}

module.exports = SeedExecutor;
