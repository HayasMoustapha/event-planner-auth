#!/usr/bin/env node

/**
 * ========================================
 * 🔍 SCRIPT DE VALIDATION DES PERMISSIONS
 * ========================================
 * Script pour valider que toutes les permissions sont bien assignées au super-admin
 */

const { Pool } = require('pg');
require('dotenv').config();

class PermissionValidator {
    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'event_planner_auth',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        });
    }

    async validatePermissions() {
        console.log('🔍 Début de la validation des permissions...\n');

        try {
            // 1. Vérifier le nombre total de permissions
            const totalPermsResult = await this.pool.query('SELECT COUNT(*) as total FROM permissions');
            const totalPermissions = parseInt(totalPermsResult.rows[0].total);
            console.log(`📊 Total permissions dans la base: ${totalPermissions}`);

            // 2. Récupérer l'ID du rôle super_admin
            const superAdminResult = await this.pool.query('SELECT id FROM roles WHERE code = $1', ['super_admin']);
            if (superAdminResult.rows.length === 0) {
                throw new Error('Rôle super_admin non trouvé');
            }
            const superAdminRoleId = superAdminResult.rows[0].id;
            console.log(`👑 Rôle super_admin trouvé (ID: ${superAdminRoleId})`);

            // 3. Vérifier les autorisations du super-admin
            const authResult = await this.pool.query(`
                SELECT COUNT(*) as total 
                FROM authorizations 
                WHERE role_id = $1
            `, [superAdminRoleId]);
            const totalAuthorizations = parseInt(authResult.rows[0].total);
            console.log(`🔗 Total autorisations super-admin: ${totalAuthorizations}`);

            // 4. Calculer le nombre attendu (toutes les permissions x tous les menus)
            const menusResult = await this.pool.query('SELECT COUNT(*) as total FROM menus');
            const totalMenus = parseInt(menusResult.rows[0].total);
            const expectedAuthorizations = totalPermissions * totalMenus;
            console.log(`📋 Total menus: ${totalMenus}`);
            console.log(`🎯 Autorisations attendues: ${expectedAuthorizations}`);

            // 5. Validation
            console.log('\n📈 RÉSULTATS DE LA VALIDATION:');
            console.log('================================');
            
            if (totalAuthorizations === expectedAuthorizations) {
                console.log('✅ SUCCÈS: Le super-admin a TOUTES les autorisations!');
                console.log(`✅ ${totalPermissions} permissions × ${totalMenus} menus = ${totalAuthorizations} autorisations`);
            } else {
                console.log('❌ ERREUR: Le super-admin n\'a pas toutes les autorisations!');
                console.log(`❌ Attendu: ${expectedAuthorizations}, Trouvé: ${totalAuthorizations}`);
                console.log(`❌ Manquant: ${expectedAuthorizations - totalAuthorizations} autorisations`);
            }

            // 6. Détail des permissions par groupe
            console.log('\n📊 DÉTAIL DES PERMISSIONS PAR GROUPE:');
            console.log('=====================================');
            
            const groupResult = await this.pool.query(`
                SELECT "group", COUNT(*) as count 
                FROM permissions 
                GROUP BY "group" 
                ORDER BY count DESC
            `);

            groupResult.rows.forEach(row => {
                console.log(`📁 ${row.group || 'sans groupe'}: ${row.count} permissions`);
            });

            // 7. Vérification des permissions manquantes spécifiques
            console.log('\n🔍 VÉRIFICATION DES PERMISSIONS AJOUTÉES:');
            console.log('==========================================');

            const newPermissions = [
                'payments.create', 'payments.read', 'payments.update',
                'payment-methods.create', 'payment-methods.read', 'payment-methods.update', 'payment-methods.delete',
                'refunds.create', 'refunds.read',
                'invoices.create', 'invoices.read',
                'wallets.read', 'wallets.withdraw',
                'commissions.read',
                'admin.wallet.transfer',
                'scans.sessions.create', 'scans.sessions.update', 'scans.sessions.read',
                'scans.operators.create', 'scans.operators.read',
                'scans.devices.create', 'scans.devices.read',
                'scans.fraud.analyze', 'scans.fraud.read',
                'tickets.jobs.create', 'tickets.jobs.process'
            ];

            for (const permCode of newPermissions) {
                const permResult = await this.pool.query('SELECT id FROM permissions WHERE code = $1', [permCode]);
                if (permResult.rows.length > 0) {
                    const permId = permResult.rows[0].id;
                    const authCheck = await this.pool.query(`
                        SELECT COUNT(*) as count 
                        FROM authorizations 
                        WHERE role_id = $1 AND permission_id = $2
                    `, [superAdminRoleId, permId]);
                    
                    const authCount = parseInt(authCheck.rows[0].count);
                    if (authCount === totalMenus) {
                        console.log(`✅ ${permCode}: ${authCount}/${totalMenus} autorisations`);
                    } else {
                        console.log(`❌ ${permCode}: ${authCount}/${totalMenus} autorisations (MANQUANT!)`);
                    }
                } else {
                    console.log(`❌ ${permCode}: Permission non trouvée!`);
                }
            }

            console.log('\n🎉 Validation terminée!');

        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error.message);
            throw error;
        }
    }

    async cleanup() {
        await this.pool.end();
    }
}

// Exécution principale
if (require.main === module) {
    const validator = new PermissionValidator();
    
    validator.validatePermissions().catch(error => {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    }).finally(() => {
        validator.cleanup();
    });
}

module.exports = PermissionValidator;
