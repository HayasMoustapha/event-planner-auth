const DatabaseBootstrap = require('./src/services/database-bootstrap.service');

async function forceSeeds() {
  try {
    console.log('🔧 Forçage de l\'exécution des seeds...');
    await DatabaseBootstrap.initialize();
    console.log('✅ Seeds forcés avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

forceSeeds();
