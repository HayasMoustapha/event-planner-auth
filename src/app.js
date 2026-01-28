const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const configValidation = require('./config/validation');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const metricsMiddleware = require('./middlewares/metrics.middleware');
const securityMiddleware = require('./middlewares/security.middleware');

// Valider la configuration au démarrage
try {
  configValidation.validateConfig();
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Import des routes
const authRoutes = require('./modules/auth/auth.routes');
const registrationRoutes = require('./modules/auth/registration.routes');
const passwordRoutes = require('./modules/password/password.routes');
const peopleRoutes = require('./modules/people/people.routes');
const usersRoutes = require('./modules/users/users.routes');
const accessesRoutes = require('./modules/accesses/accesses.routes');
const authorizationRoutes = require('./modules/authorizations/authorizations.routes');
const menuRoutes = require('./modules/menus/menus.routes');
const permissionRoutes = require('./modules/permissions/permissions.routes');
const roleRoutes = require('./modules/roles/roles.routes');
const sessionRoutes = require('./modules/sessions/sessions.routes');
const sessionMonitoringRoutes = require('./modules/sessions/session-monitoring.routes');
const testRoutes = require('./modules/test/test.routes');
const systemRoutes = require('./modules/system/system.routes');
const healthRoutes = require('./health/health.routes');
const metricsRoutes = require('./metrics/metrics.routes');
const docsRoutes = require('./docs/docs.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');

// Nouvelles routes RBAC avancées
const adminRoutes = require('./modules/admin/admin.routes');
const realtimeRoutes = require('./modules/realtime/realtime.routes');

const app = express();

// TEST: Route absolue avant tout middleware
app.post('/api/authorizations/check/permission/test', (req, res) => {
  res.json({
    success: true,
    message: 'Données reçues',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Parser (nécessaire pour lire le body JSON)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Rate limiting (désactivé pour les tests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Augmenté pour les tests automatisés
  message: {
    error: 'Trop de requêtes',
    message: 'Veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
});

app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification (désactivé pour les tests)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Augmenté pour les tests
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Veuillez réessayer plus tard'
  },
  skipSuccessfulRequests: true,
  skip: (req, res) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
});

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sécurité global (analyse toutes les requêtes SAUF les routes publiques)
app.use((req, res, next) => {
  // Routes publiques qui ne nécessitent pas de sécurité stricte
  const publicRoutes = [
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/resend-otp',
    '/api/auth/otp/email/generate',
    '/api/auth/otp/phone/generate',
    '/api/auth/otp/email/verify',
    '/api/auth/otp/phone/verify',
    '/api/auth/otp/password-reset/generate',
    '/api/auth/otp/password-reset/verify',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/check-email',
    '/api/auth/check-username',
    '/api/auth/login',
    '/api/auth/login-after-verification',
    '/api/health',
    '/health/detailed',
    '/health',
    '/ready',
    '/live',
    '/',
    '/api/docs',
    '/api/authorizations/check/permission/test'  // TEST route
  ];

  // Si c'est une route publique, appliquer une sécurité plus légère
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return securityMiddleware.security({
      enabled: true,
      logLevel: 'info',  // Moins verbeux
      blockOnHighRisk: false,  // Ne pas bloquer les routes publiques
      sanitizeInput: true
    })(req, res, next);
  }

  // Pour les autres routes, appliquer la sécurité complète
  return securityMiddleware.security({
    enabled: true,
    logLevel: 'warn',
    blockOnHighRisk: true,
    sanitizeInput: true
  })(req, res, next);
});

// Middleware de métriques (après parsing pour avoir accès aux données)
app.use(metricsMiddleware);

// Routes de santé
app.get('/', (req, res) => {
  res.json({
    name: 'Event Planner Auth API',
    version: '1.0.0',
    status: 'running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Routes de readiness et liveness
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

app.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/auth', registrationRoutes); // Ajouter les routes d'inscription directement sous /api/auth
app.use('/api/password', passwordRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accesses', accessesRoutes);

// Routes internes pour inter-services (en dehors du scope auth)
app.use('/api/internal/auth', require('./modules/auth/internal.routes')); // Routes internes pour inter-services

// Middleware d'authentification robuste pour les routes protégées
const RobustAuthMiddleware = require('../../shared/middlewares/robust-auth-middleware');
app.use('/api', RobustAuthMiddleware.authenticate());

app.use('/api/authorizations', authorizationRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions/monitoring', sessionMonitoringRoutes);

// Routes de test
app.use('/api/test', testRoutes);

// Routes système
app.use('/api/system', systemRoutes);

// Routes de monitoring et santé
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// Routes API pour compatibilité Postman
app.use('/api/health', healthRoutes);
app.use('/api/metrics', metricsRoutes);

// Routes de documentation API
app.use('/docs', docsRoutes);

// Routes du dashboard de monitoring
app.use('/dashboard', dashboardRoutes);

// Nouvelles routes RBAC avancées
app.use('/api/admin', adminRoutes);
app.use('/api/realtime', realtimeRoutes);

// Documentation API (si disponible)
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Documentation API',
    endpoints: {
      auth: '/api/auth',
      registration: '/api/auth/registration',
      people: '/api/people',
      users: '/api/users',
      accesses: '/api/accesses',
      authorizations: '/api/authorizations',
      menus: '/api/menus',
      permissions: '/api/permissions',
      roles: '/api/roles',
      sessions: '/api/sessions',
      sessionsMonitoring: '/api/sessions/monitoring',
      test: '/api/test',
      system: '/api/system',
      health: '/health',
      metrics: '/metrics',
      docs: '/docs',
      dashboard: '/dashboard'
    }
  });
});

// Middleware d'erreurs
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
