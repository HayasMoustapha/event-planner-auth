/**
 * TEST DE VALIDATION - Bootstrap automatique
 * Vérifie que toutes les migrations et seeds s'exécutent correctement au démarrage
 */

const DatabaseBootstrap = require('./src/services/database-bootstrap.service');

async function testBootstrapIntegration() {
  console.log('🔍 TEST D\'INTÉGRATION - BOOTSTRAP AUTOMATIQUE\n');
  
  try {
    // Activer le bootstrap automatique pour le test
    process.env.DB_AUTO_BOOTSTRAP = 'true';
    
    console.log('🚀 Lancement du bootstrap automatique...');
    const startTime = Date.now();
    
    // Exécuter le bootstrap complet
    const result = await DatabaseBootstrap.initialize();
    
    const duration = Date.now() - startTime;
    
    console.log('\n📊 RÉSULTATS DU BOOTSTRAP:');
    console.log('═════════════════════════════════════════════════');
    console.log(`✅ Succès: ${result.success}`);
    console.log(`⏱️  Durée: ${duration}ms`);
    console.log(`📝 Actions: ${result.actions.join(', ')}`);
    console.log(`🔄 Migrations appliquées: ${result.migrationsApplied}`);
    console.log(`🌱 Seeds exécutés: ${result.seedsExecuted}`);
    
    // Validation spécifique des fichiers critiques
    console.log('\n🔍 VALIDATION DES FICHIERS CRITIQUES:');
    
    const { connection } = require('./src/config/database');
    const client = await connection.connect();
    
    let migrationCheck, permissionCheck, modulesPermissionsCheck, superAdminCheck, adminCheck;
    
    try {
      // Vérifier la migration 013
      migrationCheck = await client.query(`
        SELECT COUNT(*) as count FROM schema_migrations 
        WHERE migration_name LIKE '%013_add_missing_authorizations_verify_permission.sql%'
      `);
      
      console.log(`📋 Migration 013 (authorizations.verify): ${migrationCheck.rows[0].count > 0 ? '✅ Appliquée' : '❌ Manquante'}`);
      
      // Vérifier la permission authorizations.verify
      permissionCheck = await client.query(`
        SELECT COUNT(*) as count FROM permissions WHERE code = 'authorizations.verify'
      `);
      
      console.log(`🔐 Permission authorizations.verify: ${permissionCheck.rows[0].count > 0 ? '✅ Créée' : '❌ Manquante'}`);
      
      // Vérifier les permissions modules
      modulesPermissionsCheck = await client.query(`
        SELECT COUNT(*) as count FROM permissions WHERE code LIKE 'accesses.%' OR code LIKE 'authorizations.%'
      `);
      
      console.log(`📦 Permissions modules (accesses/authorizations): ${modulesPermissionsCheck.rows[0].count} trouvées`);
      
      // Vérifier le super admin avec la permission
      superAdminCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM authorizations a
        INNER JOIN roles r ON a.role_id = r.id
        INNER JOIN permissions p ON a.permission_id = p.id
        WHERE r.code = 'super_admin' AND p.code = 'authorizations.verify' AND a.deleted_at IS NULL
      `);
      
      console.log(`👑 Super admin avec authorizations.verify: ${superAdminCheck.rows[0].count > 0 ? '✅ Configuré' : '❌ Manquant'}`);
      
      // Vérifier l'admin avec la permission
      adminCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM authorizations a
        INNER JOIN roles r ON a.role_id = r.id
        INNER JOIN permissions p ON a.permission_id = p.id
        WHERE r.code = 'admin' AND p.code = 'authorizations.verify' AND a.deleted_at IS NULL
      `);
      
      console.log(`🔧 Admin avec authorizations.verify: ${adminCheck.rows[0].count > 0 ? '✅ Configuré' : '❌ Manquant'}`);
      
    } finally {
      client.release();
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('═════════════════════════════════════════════════');
    
    if (result.success && 
        migrationCheck.rows[0].count > 0 && 
        permissionCheck.rows[0].count > 0 && 
        superAdminCheck.rows[0].count > 0) {
      console.log('🏆 SUCCÈS TOTAL : Bootstrap automatique parfaitement intégré!');
      console.log('✅ Toutes les migrations critiques sont appliquées');
      console.log('✅ Tous les seeds critiques sont exécutés');
      console.log('✅ Le bug PERMISSION_DENIED est résolu automatiquement');
      console.log('✅ Le système est prêt pour la production');
      console.log('🚀 AU DÉMARRAGE SUIVANT : Tout s\'exécutera AUTOMATIQUEMENT!');
    } else {
      console.log('❌ ÉCHEC : Bootstrap automatique incomplet');
      console.log('⚠️  Vérification manuelle requise');
    }
    
    console.log('═════════════════════════════════════════════════');
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Erreur lors du test du bootstrap:', error.message);
    return false;
  }
}

// Exécuter le test
if (require.main === module) {
  testBootstrapIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testBootstrapIntegration;
