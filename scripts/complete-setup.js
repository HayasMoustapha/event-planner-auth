#!/usr/bin/env node

/**
 * Script complet pour appliquer les migrations et configurer le super-admin
 */

const { applyNewMigrations } = require('./apply-new-migrations');
const { setupSuperAdmin } = require('./setup-superadmin-correct');

async function main() {
  console.log('🎯 SCRIPT COMPLET DE MIGRATION ET CONFIGURATION');
  console.log('=============================================\n');
  
  try {
    // Étape 1: Appliquer les migrations non exécutées
    console.log('📂 ÉTAPE 1: APPLICATION DES MIGRATIONS\n');
    await applyNewMigrations();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Étape 2: Configurer le super-admin
    console.log('👑 ÉTAPE 2: CONFIGURATION DU SUPER-ADMIN\n');
    await setupSuperAdmin();
    
    console.log('\n🎉 OPÉRATION TERMINÉE AVEC SUCCÈS!');
    console.log('✅ Toutes les migrations ont été appliquées');
    console.log('✅ Le super-admin a été configuré avec toutes les permissions');
    
  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
