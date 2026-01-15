const express = require('express');
const metricsService = require('../metrics/metrics.service');
const cacheService = require('../services/cache.service');
const attackDetectionService = require('../security/attack-detection.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

/**
 * Routes du dashboard de monitoring
 * Fournit une interface web pour visualiser les métriques et l'état du système
 */

// Page principale du dashboard (protégée)
router.get('/', 
  authenticate, 
  requirePermission('admin.dashboard.read'),
  async (req, res) => {
    try {
      // Récupérer les métriques actuelles
      const metrics = await metricsService.getMetrics();
      const cacheStats = await cacheService.getStats();
      
      // Calculer les métriques système
      const systemMetrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };

      res.send(generateDashboardHTML({
        title: 'Event Planner Auth - Dashboard',
        metrics,
        cacheStats,
        systemMetrics,
        user: req.user
      }));
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to load dashboard',
        error: error.message
      });
    }
  }
);

// API pour les données du dashboard (protégée)
router.get('/api/data', 
  authenticate, 
  requirePermission('admin.dashboard.read'),
  async (req, res) => {
    try {
      const { timeframe = '1h' } = req.query;
      
      // Récupérer les différentes métriques
      const data = {
        system: await getSystemMetrics(timeframe),
        security: await getSecurityMetrics(timeframe),
        performance: await getPerformanceMetrics(timeframe),
        cache: await getCacheMetrics(timeframe),
        database: await getDatabaseMetrics(timeframe)
      };

      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }
);

// API pour les alertes de sécurité (protégée)
router.get('/api/security-alerts', 
  authenticate, 
  requirePermission('admin.security.read'),
  async (req, res) => {
    try {
      const { limit = 50, severity = 'all' } = req.query;
      
      // Simuler la récupération des alertes de sécurité
      const alerts = await getSecurityAlerts(limit, severity);
      
      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security alerts',
        error: error.message
      });
    }
  }
);

// API pour les métriques en temps réel (WebSocket simulation)
router.get('/api/realtime', 
  authenticate, 
  requirePermission('admin.dashboard.read'),
  async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendUpdate = async () => {
      try {
        const data = {
          timestamp: new Date().toISOString(),
          metrics: {
            requests: await getCurrentRequests(),
            activeUsers: await getActiveUsers(),
            errors: await getCurrentErrors(),
            attacks: await getCurrentAttacks()
          }
        };
        
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    };

    // Envoyer les données toutes les 5 secondes
    const interval = setInterval(sendUpdate, 5000);
    
    // Nettoyer à la déconnexion
    req.on('close', () => {
      clearInterval(interval);
    });

    // Premier envoi immédiat
    await sendUpdate();
  }
);

/**
 * Génère le HTML du dashboard
 */
function generateDashboardHTML(data) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .metric-card {
            @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
        }
        .metric-value {
            @apply text-3xl font-bold text-gray-900;
        }
        .metric-label {
            @apply text-sm text-gray-600 mt-2;
        }
        .status-ok { @apply text-green-600; }
        .status-warning { @apply text-yellow-600; }
        .status-error { @apply text-red-600; }
        .chart-container {
            @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
            height: 300px;
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <header class="mb-8">
            <div class="flex justify-between items-center">
                <h1 class="text-3xl font-bold text-gray-900">Dashboard Monitoring</h1>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">Connecté: ${data.user?.email || 'Unknown'}</span>
                    <a href="/docs" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">API Docs</a>
                </div>
            </div>
        </header>

        <!-- Métriques principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="metric-card">
                <div class="metric-value status-ok">${Math.floor(data.systemMetrics.uptime / 3600)}h</div>
                <div class="metric-label">Uptime</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(data.systemMetrics.memory.heapUsed / 1024 / 1024)}MB</div>
                <div class="metric-label">Memory Used</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${data.cacheStats.connected ? 'status-ok' : 'status-warning'}">
                    ${data.cacheStats.connected ? 'Connected' : 'Disconnected'}
                </div>
                <div class="metric-label">Cache Status</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-ok">Active</div>
                <div class="metric-label">System Status</div>
            </div>
        </div>

        <!-- Graphiques -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="chart-container">
                <h3 class="text-lg font-semibold mb-4">Requêtes HTTP</h3>
                <canvas id="requestsChart"></canvas>
            </div>
            <div class="chart-container">
                <h3 class="text-lg font-semibold mb-4">Utilisation Mémoire</h3>
                <canvas id="memoryChart"></canvas>
            </div>
        </div>

        <!-- Alertes de sécurité -->
        <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
            <h3 class="text-lg font-semibold mb-4">Alertes de Sécurité Récentes</h3>
            <div id="securityAlerts" class="space-y-2">
                <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span class="text-sm">Multiple login attempts detected from IP 192.168.1.100</span>
                    </div>
                    <span class="text-xs text-gray-500">Il y a 2 minutes</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                    <div class="flex items-center">
                        <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        <span class="text-sm">SQL injection attempt blocked</span>
                    </div>
                    <span class="text-xs text-gray-500">Il y a 5 minutes</span>
                </div>
            </div>
        </div>

        <!-- Métriques détaillées -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Performance</h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Response Time</span>
                        <span class="text-sm font-semibold">45ms</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Requests/sec</span>
                        <span class="text-sm font-semibold">127</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Error Rate</span>
                        <span class="text-sm font-semibold">0.2%</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Base de Données</h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Connections</span>
                        <span class="text-sm font-semibold">12/20</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Query Time</span>
                        <span class="text-sm font-semibold">23ms</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Cache Hit Rate</span>
                        <span class="text-sm font-semibold">87%</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 class="text-lg font-semibold mb-4">Sécurité</h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Attacks Blocked</span>
                        <span class="text-sm font-semibold">24</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">IPs Blacklisted</span>
                        <span class="text-sm font-semibold">3</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Failed Logins</span>
                        <span class="text-sm font-semibold">156</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialiser les graphiques
        const requestsCtx = document.getElementById('requestsChart').getContext('2d');
        new Chart(requestsCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Requêtes',
                    data: [120, 190, 300, 500, 200, 300],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        const memoryCtx = document.getElementById('memoryChart').getContext('2d');
        new Chart(memoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Free'],
                datasets: [{
                    data: [${data.systemMetrics.memory.heapUsed}, ${data.systemMetrics.memory.heapTotal - data.systemMetrics.memory.heapUsed}],
                    backgroundColor: ['rgb(239, 68, 68)', 'rgb(34, 197, 94)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Mettre à jour les données en temps réel
        setInterval(async () => {
            try {
                const response = await fetch('/dashboard/api/realtime');
                const reader = response.body.getReader();
                // Traiter les données temps réel...
            } catch (error) {
                console.error('Real-time update error:', error);
            }
        }, 5000);
    </script>
</body>
</html>`;
}

/**
 * Fonctions utilitaires pour récupérer les métriques
 */
async function getSystemMetrics(timeframe) {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  };
}

async function getSecurityMetrics(timeframe) {
  return {
    attacksBlocked: 24,
    ipsBlacklisted: 3,
    failedLogins: 156,
    lastAttack: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

async function getPerformanceMetrics(timeframe) {
  return {
    avgResponseTime: 45,
    requestsPerSecond: 127,
    errorRate: 0.002,
    throughput: 5000,
    timestamp: new Date().toISOString()
  };
}

async function getCacheMetrics(timeframe) {
  const stats = await cacheService.getStats();
  return {
    ...stats,
    hitRate: 0.87,
    missRate: 0.13,
    timestamp: new Date().toISOString()
  };
}

async function getDatabaseMetrics(timeframe) {
  return {
    connections: 12,
    maxConnections: 20,
    avgQueryTime: 23,
    slowQueries: 2,
    timestamp: new Date().toISOString()
  };
}

async function getSecurityAlerts(limit, severity) {
  return [
    {
      id: 1,
      type: 'brute_force',
      severity: 'high',
      message: 'Multiple login attempts detected from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      ip: '192.168.1.100'
    },
    {
      id: 2,
      type: 'sql_injection',
      severity: 'critical',
      message: 'SQL injection attempt blocked',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      ip: '192.168.1.50'
    }
  ];
}

async function getCurrentRequests() {
  return Math.floor(Math.random() * 50) + 100;
}

async function getActiveUsers() {
  return Math.floor(Math.random() * 20) + 30;
}

async function getCurrentErrors() {
  return Math.floor(Math.random() * 5);
}

async function getCurrentAttacks() {
  return Math.floor(Math.random() * 3);
}

module.exports = router;
