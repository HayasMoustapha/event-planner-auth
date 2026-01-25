#!/usr/bin/env node

/**
 * ========================================
 * 🧪 SCRIPT DE TEST DES PERMISSIONS PAR SERVICE
 * ========================================
 * Script pour tester que toutes les routes protégées fonctionnent avec les permissions du super-admin
 */

const axios = require('axios');
require('dotenv').config();

class PermissionTester {
    constructor() {
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
        this.token = null;
        
        // Services à tester
        this.services = {
            'event-planner-auth': 'http://localhost:3000',
            'event-planner-core': 'http://localhost:3001',
            'payment-service': 'http://localhost:3003',
            'scan-validation-service': 'http://localhost:3005',
            'notification-service': 'http://localhost:3002',
            'ticket-generator-service': 'http://localhost:3004'
        };

        // Routes critiques à tester par service
        this.testRoutes = {
            'event-planner-auth': [
                { method: 'GET', path: '/api/permissions', description: 'Lister permissions' },
                { method: 'GET', path: '/api/roles', description: 'Lister rôles' },
                { method: 'GET', path: '/api/users', description: 'Lister utilisateurs' },
                { method: 'POST', path: '/api/roles', description: 'Créer rôle (test)', body: { code: 'test', label: { fr: 'Test' } } }
            ],
            'event-planner-core': [
                { method: 'GET', path: '/api/events', description: 'Lister événements' },
                { method: 'POST', path: '/api/events', description: 'Créer événement (test)', body: { title: 'Test Event', description: 'Test', event_date: '2024-12-31', location: 'Test', organizer_id: 1 } },
                { method: 'GET', path: '/api/guests', description: 'Lister invités' },
                { method: 'GET', path: '/api/tickets', description: 'Lister tickets' }
            ],
            'payment-service': [
                { method: 'GET', path: '/api/payments', description: 'Lister paiements' },
                { method: 'GET', path: '/api/payments/statistics', description: 'Statistiques paiements' },
                { method: 'GET', path: '/api/customers', description: 'Lister clients' },
                { method: 'GET', path: '/api/wallets/balance', description: 'Solde portefeuille' }
            ],
            'scan-validation-service': [
                { method: 'GET', path: '/api/scans/stats', description: 'Statistiques scans' },
                { method: 'GET', path: '/api/scans/sessions/active', description: 'Sessions actives' },
                { method: 'POST', path: '/api/scans/qr/test', description: 'Générer QR test', body: { ticketId: 'test-123' } }
            ],
            'notification-service': [
                { method: 'GET', path: '/api/notifications/stats', description: 'Statistiques notifications' },
                { method: 'GET', path: '/api/notifications/queues/stats', description: 'Stats queues' }
            ],
            'ticket-generator-service': [
                { method: 'GET', path: '/api/tickets/queue/stats', description: 'Stats queue tickets' },
                { method: 'GET', path: '/api/tickets/jobs', description: 'Lister jobs tickets' }
            ]
        };
    }

    async login() {
        console.log('🔐 Connexion au service auth...');
        
        try {
            const response = await axios.post(`${this.services['event-planner-auth']}/api/auth/login`, {
                email: 'admin@eventplanner.com',
                password: 'Admin123!'
            });

            if (response.data.success && response.data.data.token) {
                this.token = response.data.data.token;
                console.log('✅ Connexion réussie');
                return true;
            } else {
                console.error('❌ Échec de la connexion: réponse invalide');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur de connexion:', error.response?.data?.message || error.message);
            return false;
        }
    }

    async testRoute(serviceName, route) {
        const baseURL = this.services[serviceName];
        const url = `${baseURL}${route.path}`;
        
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            };

            let response;
            if (route.method === 'GET') {
                response = await axios.get(url, config);
            } else if (route.method === 'POST') {
                response = await axios.post(url, route.body || {}, config);
            }

            return {
                success: true,
                status: response.status,
                description: route.description
            };
        } catch (error) {
            return {
                success: false,
                status: error.response?.status || 'N/A',
                error: error.response?.data?.message || error.message,
                description: route.description
            };
        }
    }

    async testService(serviceName) {
        console.log(`\n🧪 Test du service: ${serviceName}`);
        console.log('================================');
        
        const routes = this.testRoutes[serviceName];
        if (!routes || routes.length === 0) {
            console.log('ℹ️  Aucune route à tester pour ce service');
            return { success: 0, failed: 0, total: 0 };
        }

        let success = 0;
        let failed = 0;

        for (const route of routes) {
            console.log(`   📡 ${route.method} ${route.path} - ${route.description}`);
            
            const result = await this.testRoute(serviceName, route);
            
            if (result.success) {
                console.log(`      ✅ ${result.status} - Succès`);
                success++;
            } else {
                console.log(`      ❌ ${result.status} - ${result.error}`);
                failed++;
            }
        }

        return { success, failed, total: routes.length };
    }

    async runAllTests() {
        console.log('🚀 DÉBUT DES TESTS DE PERMISSIONS');
        console.log('==================================');
        
        // 1. Connexion
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.error('❌ Impossible de se connecter, arrêt des tests');
            return;
        }

        // 2. Tester chaque service
        let totalSuccess = 0;
        let totalFailed = 0;
        let totalServices = 0;
        let workingServices = 0;

        for (const serviceName of Object.keys(this.services)) {
            try {
                const result = await this.testService(serviceName);
                totalSuccess += result.success;
                totalFailed += result.failed;
                totalServices++;
                
                if (result.success > 0 || result.failed === 0) {
                    workingServices++;
                }
                
                console.log(`   📊 Résultat: ${result.success}/${result.total} réussis`);
            } catch (error) {
                console.log(`   ❌ Service inaccessible: ${error.message}`);
                totalFailed++;
                totalServices++;
            }
        }

        // 3. Résumé final
        console.log('\n📊 RÉSUMÉ FINAL DES TESTS');
        console.log('========================');
        console.log(`📈 Services testés: ${totalServices}/${Object.keys(this.services).length}`);
        console.log(`✅ Services fonctionnels: ${workingServices}`);
        console.log(`🎯 Routes réussies: ${totalSuccess}`);
        console.log(`❌ Routes échouées: ${totalFailed}`);
        console.log(`📊 Taux de réussite: ${totalSuccess > 0 ? Math.round((totalSuccess / (totalSuccess + totalFailed)) * 100) : 0}%`);

        if (totalFailed === 0) {
            console.log('\n🎉 TOUS LES TESTS RÉUSSIS! Le super-admin a bien toutes les permissions!');
        } else {
            console.log('\n⚠️  Certains tests ont échoué. Vérifiez:');
            console.log('   - Que les services sont bien démarrés');
            console.log('   - Que les ports sont corrects');
            console.log('   - Que les permissions sont bien assignées');
        }
    }
}

// Exécution principale
if (require.main === module) {
    const tester = new PermissionTester();
    
    tester.runAllTests().catch(error => {
        console.error('❌ Erreur fatale lors des tests:', error.message);
        process.exit(1);
    });
}

module.exports = PermissionTester;
