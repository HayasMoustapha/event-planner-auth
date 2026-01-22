#!/usr/bin/env node

/**
 * Script de validation de la configuration Docker
 * Vérifie que tous les fichiers nécessaires sont présents et valides
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation de la configuration Docker...\n');

const requiredFiles = [
  'Dockerfile',
  'docker-compose.yml',
  'docker-entrypoint.sh',
  '.env.docker.example',
  '.dockerignore'
];

const checks = [];

// Vérifier la présence des fichiers requis
console.log('📋 Vérification des fichiers requis:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  checks.push({ file, exists, type: 'file' });
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Vérifier que Dockerfile est exécutable
const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
const hasEntrypoint = dockerfileContent.includes('ENTRYPOINT ["docker-entrypoint.sh"]');
checks.push({ item: 'Dockerfile ENTRYPOINT', valid: hasEntrypoint, type: 'config' });
console.log(`  ${hasEntrypoint ? '✅' : '❌'} Dockerfile a un ENTRYPOINT personnalisé`);

// Vérifier que docker-entrypoint.sh est exécutable
try {
  fs.accessSync('docker-entrypoint.sh', fs.constants.X_OK);
  checks.push({ item: 'docker-entrypoint.sh executable', valid: true, type: 'permission' });
  console.log('  ✅ docker-entrypoint.sh est exécutable');
} catch (error) {
  checks.push({ item: 'docker-entrypoint.sh executable', valid: false, type: 'permission' });
  console.log('  ❌ docker-entrypoint.sh n\'est pas exécutable');
}

// Vérifier la syntaxe docker-compose.yml
try {
  const yaml = require('js-yaml');
  const composeContent = fs.readFileSync('docker-compose.yml', 'utf8');
  const composeConfig = yaml.load(composeContent);
  
  const hasServices = composeConfig.services && Object.keys(composeConfig.services).length > 0;
  const hasAuth = composeConfig.services && composeConfig.services['auth-service'];
  const hasPostgres = composeConfig.services && composeConfig.services.postgres;
  const hasRedis = composeConfig.services && composeConfig.services.redis;
  const hasVolumes = composeConfig.volumes;
  const hasNetworks = composeConfig.networks;
  
  checks.push({ item: 'docker-compose.yml syntax', valid: true, type: 'syntax' });
  checks.push({ item: 'Services définis', valid: hasServices, type: 'config' });
  checks.push({ item: 'Service auth-service', valid: hasAuth, type: 'config' });
  checks.push({ item: 'Service postgres', valid: hasPostgres, type: 'config' });
  checks.push({ item: 'Service redis', valid: hasRedis, type: 'config' });
  checks.push({ item: 'Volumes définis', valid: hasVolumes, type: 'config' });
  checks.push({ item: 'Réseaux définis', valid: hasNetworks, type: 'config' });
  
  console.log('  ✅ docker-compose.yml syntaxe valide');
  console.log(`  ${hasServices ? '✅' : '❌'} Services définis`);
  console.log(`  ${hasAuth ? '✅' : '❌'} Service auth-service`);
  console.log(`  ${hasPostgres ? '✅' : '❌'} Service postgres`);
  console.log(`  ${hasRedis ? '✅' : '❌'} Service redis`);
  console.log(`  ${hasVolumes ? '✅' : '❌'} Volumes définis`);
  console.log(`  ${hasNetworks ? '✅' : '❌'} Réseaux définis`);
  
} catch (error) {
  checks.push({ item: 'docker-compose.yml syntax', valid: false, type: 'syntax' });
  console.log('  ❌ docker-compose.yml syntaxe invalide');
}

// Vérifier .env.docker.example
const envExampleContent = fs.readFileSync('.env.docker.example', 'utf8');
const hasJwtSecret = envExampleContent.includes('JWT_SECRET');
const hasDbPassword = envExampleContent.includes('DB_PASSWORD');
const hasSecurityInstructions = envExampleContent.includes('SÉCURITÉ');

checks.push({ item: '.env.docker.example JWT_SECRET', valid: hasJwtSecret, type: 'config' });
checks.push({ item: '.env.docker.example DB_PASSWORD', valid: hasDbPassword, type: 'config' });
checks.push({ item: '.env.docker.example sécurité', valid: hasSecurityInstructions, type: 'config' });

console.log(`  ${hasJwtSecret ? '✅' : '❌'} .env.docker.example contient JWT_SECRET`);
console.log(`  ${hasDbPassword ? '✅' : '❌'} .env.docker.example contient DB_PASSWORD`);
console.log(`  ${hasSecurityInstructions ? '✅' : '❌'} .env.docker.example contient instructions sécurité`);

// Vérifier .dockerignore
const dockerignoreContent = fs.readFileSync('.dockerignore', 'utf8');
const excludesNodeModules = dockerignoreContent.includes('node_modules');
const excludesEnv = dockerignoreContent.includes('.env');
const excludesGit = dockerignoreContent.includes('.git');

checks.push({ item: '.dockerignore node_modules', valid: excludesNodeModules, type: 'config' });
checks.push({ item: '.dockerignore .env', valid: excludesEnv, type: 'config' });
checks.push({ item: '.dockerignore .git', valid: excludesGit, type: 'config' });

console.log(`  ${excludesNodeModules ? '✅' : '❌'} .dockerignore exclut node_modules`);
console.log(`  ${excludesEnv ? '✅' : '❌'} .dockerignore exclut .env`);
console.log(`  ${excludesGit ? '✅' : '❌'} .dockerignore exclut .git`);

// Résultats
console.log('\n📊 RÉSULTATS DE LA VALIDATION:');
const totalChecks = checks.length;
const passedChecks = checks.filter(check => check.valid !== false && check.exists !== false).length;
const failedChecks = totalChecks - passedChecks;

console.log(`   Total des vérifications: ${totalChecks}`);
console.log(`   Réussies: ${passedChecks} ✅`);
console.log(`   Échouées: ${failedChecks} ❌`);
console.log(`   Taux de réussite: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

if (failedChecks > 0) {
  console.log('\n❌ VALIDATION ÉCHOUÉE - Corrections nécessaires:');
  checks.filter(check => (check.valid === false || check.exists === false)).forEach(check => {
    console.log(`   • ${check.item}: ${check.type === 'file' ? 'Fichier manquant' : 'Configuration invalide'}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 VALIDATION RÉUSSIE - Configuration Docker prête!');
  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('   1. Installer Docker et Docker Compose');
  console.log('   2. Copier .env.docker.example vers .env');
  console.log('   3. Configurer les secrets dans .env');
  console.log('   4. Exécuter: docker-compose up -d');
  console.log('   5. Vérifier: docker-compose ps');
  console.log('   6. Tester: curl http://localhost:3000/api/health');
}
