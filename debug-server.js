/**
 * Script de test simple pour isoler le problème de démarrage
 */

console.log('🔍 Démarrage du serveur de test...');

try {
  // Importer l'application
  const app = require('./src/app');
  
  // Démarrer le serveur
  const server = app.listen(3001, () => {
    console.log('✅ Serveur de test démarré sur le port 3001');
    console.log('📊 URL: http://localhost:3001');
    console.log('🔍 Appuyez sur Ctrl+C pour arrêter');
  });
  
  // Gérer l'arrêt gracieux
  process.on('SIGINT', () => {
    console.log('\n📡 Arrêt du serveur...');
    server.close(() => {
      console.log('✅ Serveur arrêté avec succès');
      process.exit(0);
    });
  });
  
  process.on('SIGTERM', () => {
    console.log('\n📡 Signal SIGTERM reçu, arrêt du serveur...');
    server.close(() => {
      console.log('✅ Serveur arrêté avec succès');
      process.exit(0);
    });
  });
  
  // Gérer les erreurs
  process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non capturée:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Rejet non géré:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Erreur lors du démarrage:', error.message);
  console.error(error.stack);
  process.exit(1);
}
