const DatabaseBootstrap = require('./services/database-bootstrap.service');

/**
 * Point d'entrée pour le bootstrap de base de données
 * Utilitaire autonome pour exécuter le bootstrap manuellement
 */
async function runBootstrap() {
  const bootstrap = new DatabaseBootstrap();
  
  try {
    console.log('🔧 Lancement manuel du bootstrap de la base de données...');
    const result = await bootstrap.initialize();
    
    if (result.success) {
      console.log('\n📊 Rapport du bootstrap:');
      console.log(`⏱️  Durée: ${result.duration}ms`);
      console.log(`🔄 Migrations appliquées: ${result.migrationsApplied}`);
      console.log(`🌱 Seeds exécutés: ${result.seedsExecuted}`);
      console.log(`✅ Actions: ${result.actions.join(', ')}`);
      
      // Afficher l'état des migrations
      const status = await bootstrap.getMigrationStatus();
      if (status.length > 0) {
        console.log('\n📋 État des migrations:');
        status.forEach(migration => {
          console.log(`   ${migration.migration_name} - ${migration.executed_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur critique lors du bootstrap:', error.message);
    process.exit(1);
  }
}

// Exécuter uniquement si appelé directement
if (require.main === module) {
  runBootstrap();
}

module.exports = { runBootstrap, DatabaseBootstrap };
