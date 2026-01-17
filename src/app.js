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
const peopleRoutes = require('./modules/people/people.routes');
const usersRoutes = require('./modules/users/users.routes');
const authorizationRoutes = require('./modules/authorizations/authorizations.routes');
const menuRoutes = require('./modules/menus/menus.routes');
const permissionRoutes = require('./modules/permissions/permissions.routes');
const roleRoutes = require('./modules/roles/roles.routes');
const sessionRoutes = require('./modules/sessions/sessions.routes');
const sessionMonitoringRoutes = require('./modules/sessions/session-monitoring.routes');
const healthRoutes = require('./health/health.routes');
const metricsRoutes = require('./metrics/metrics.routes');
const docsRoutes = require('./docs/docs.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');

const app = express();

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
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes',
    message: 'Veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV === 'test'
});

app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification (désactivé pour les tests)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Augmenté pour les tests
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Veuillez réessayer plus tard'
  },
  skipSuccessfulRequests: true,
  skip: (req, res) => process.env.NODE_ENV === 'test'
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
    '/api/docs'
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

// Routes API
app.use('/api/auth', 
  securityMiddleware.bruteForceProtection({
    identifier: 'email',
    maxAttempts: 5,
    windowMs: 900000, // 15 minutes
    lockoutMs: 1800000  // 30 minutes
  }), 
  authLimiter, 
  authRoutes
);
// app.use('/api/auth', registrationRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/authorizations', authorizationRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions/monitoring', sessionMonitoringRoutes);

// Routes de monitoring et santé
app.use('/', healthRoutes);
app.use('/metrics', metricsRoutes);

// Routes de documentation API
app.use('/docs', docsRoutes);

// Routes du dashboard de monitoring
app.use('/dashboard', dashboardRoutes);

// Documentation API (si disponible)
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Documentation API',
    endpoints: {
      auth: '/api/auth',
      people: '/api/people',
      users: '/api/users',
      sessions: '/api/sessions',
      sessionsMonitoring: '/api/sessions/monitoring',
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
