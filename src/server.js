require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const { connection } = require('./config/database');
const bootstrap = require('./bootstrap');
const { validateConfig } = require('../../shared/config-validator');

// Valider la configuration au démarrage
validateConfig('Auth Service', [
  'NODE_ENV',
  'PORT', 
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET'
]);

// Bootstrap automatique de l'application
const runApplicationBootstrap = async () => {
  try {
    await bootstrap.initialize();
    console.log('✅ Application bootstrap completed successfully');
  } catch (error) {
    console.error('❌ Erreur critique lors du bootstrap:', error.message);
    // En production, on peut choisir de continuer ou d'arrêter
    if (env.NODE_ENV === 'production') {
      console.error('🚨 Arrêt du serveur en production suite à l\'échec du bootstrap');
      process.exit(1);
    } else {
      console.warn('⚠️  Le serveur continue en mode développement malgré l\'échec du bootstrap');
    }
  }
};

// Test de connexion à la base de données
const testDatabaseConnection = async () => {
  try {
    const client = await connection.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Connexion à PostgreSQL réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error.message);
    console.log('⚠️  Le serveur continue sans base de données');
  }
};

// Démarrage du serveur
const startServer = async () => {
  // 1. Bootstrap automatique de l'application
  await runApplicationBootstrap();
  
  // 2. Test de connexion standard
  await testDatabaseConnection();
  
  const server = app.listen(env.PORT, () => {
    console.log(`
🚀 Serveur Event Planner Auth API démarré!
📍 Port: ${env.PORT}
🌍 Environnement: ${env.NODE_ENV}
🕐 Heure: ${new Date().toLocaleString()}
📖 Documentation: http://localhost:${env.PORT}/api/docs
❤️  Santé: http://localhost:${env.PORT}/api/health
  `);
  });

  // Gestion gracieuse de l'arrêt
  const gracefulShutdown = (signal) => {
    console.log(`\n📡 Signal ${signal} reçu, arrêt gracieux du serveur...`);
    
    server.close(() => {
      console.log('✅ Serveur arrêté avec succès');
      process.exit(0);
    });

    // Forcer l'arrêt après 10 secondes
    setTimeout(() => {
      console.error('⏰ Timeout: Arrêt forcé du serveur');
      process.exit(1);
    }, 10000);
  };

  // Écouter les signaux d'arrêt
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Gestion des erreurs non capturées
  process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non capturée:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Rejet non géré:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });

  return server;
};

// Démarrer le serveur
startServer().catch(console.error);
