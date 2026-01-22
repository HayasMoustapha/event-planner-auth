#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Routes critiques à ajouter manquantes
const criticalRoutes = [
  // Users routes manquantes
  { module: 'users', method: 'GET', path: '/authenticate', action: 'authenticateRoute' },
  { module: 'users', method: 'GET', path: '/email/:email', action: 'getByEmailRoute' },
  { module: 'users', method: 'GET', path: '/username/:username', action: 'getByUsernameRoute' },
  
  // Sessions routes manquantes
  { module: 'sessions', method: 'GET', path: '/active/count', action: 'getActiveCountRoute' },
  { module: 'sessions', method: 'GET', path: '/current', action: 'getCurrentRoute' },
  { module: 'sessions', method: 'GET', path: '/device/mobile', action: 'getDeviceMobileRoute' },
  { module: 'sessions', method: 'GET', path: '/expired', action: 'getExpiredRoute' },
  { module: 'sessions', method: 'GET', path: '/history/:userId', action: 'getHistoryRoute' },
  { module: 'sessions', method: 'GET', path: '/ip/:ip', action: 'getByIpRoute' },
  { module: 'sessions', method: 'POST', path: '/logout', action: 'logoutRoute' },
  { module: 'sessions', method: 'POST', path: '/logout-all', action: 'logoutAllRoute' },
  { module: 'sessions', method: 'POST', path: '/password-reset/generate', action: 'generatePasswordResetRoute' },
  { module: 'sessions', method: 'POST', path: '/refresh', action: 'refreshRoute' },
  { module: 'sessions', method: 'POST', path: '/revoke', action: 'revokeRoute' },
  { module: 'sessions', method: 'POST', path: '/revoke-all/:userId', action: 'revokeAllRoute' },
  { module: 'sessions', method: 'GET', path: '/stats', action: 'getStatsRoute' },
  { module: 'sessions', method: 'GET', path: '/user/:userId', action: 'getUserSessionsRoute' },
  { module: 'sessions', method: 'POST', path: '/validate', action: 'validateRoute' }
];

console.log('🔧 AJOUT RAPIDE DES ROUTES CRITIQUES MANQUANTES');
console.log('=' .repeat(60));

criticalRoutes.forEach((route, index) => {
  console.log(`${index + 1}. ${route.method} ${route.path} -> ${route.module}/${route.action}`);
});

console.log('\n📝 ROUTES PRIORITAIRES:');
console.log('1. Users module - routes GET manquantes');
console.log('2. Sessions module - routes GET/POST manquantes');
console.log('3. Valider que les contrôleurs existent');
console.log('4. Tester les nouvelles routes');

console.log('\n⚡ ACTION IMMÉDIATE:');
console.log('Les routes les plus critiques ont été identifiées.');
console.log('Utiliser ce script comme guide pour ajouter les routes manquantes.');
