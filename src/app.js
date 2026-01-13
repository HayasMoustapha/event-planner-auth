const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// Import des routes
const authRoutes = require('./modules/auth/auth.routes');
const peopleRoutes = require('./modules/people/people.routes');
const usersRoutes = require('./modules/users/users.routes');

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes',
    message: 'Veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Veuillez réessayer plus tard'
  },
  skipSuccessfulRequests: true,
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// Routes API
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/users', usersRoutes);

// Documentation API (si disponible)
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Documentation API',
    endpoints: {
      auth: '/api/auth',
      people: '/api/people',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// Middleware d'erreurs
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
