#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Routes Postman complètes extraites précédemment
const postmanRoutes = [
  // Auth routes
  'GET /api/auth/change-password',
  'GET /api/auth/check-email/{{userEmail}}',
  'GET /api/auth/check-username/johndoe', 
  'POST /api/auth/forgot-password',
  'POST /api/auth/login',
  'POST /api/auth/login-after-verification',
  'POST /api/auth/login-otp',
  'POST /api/auth/login-remember',
  'POST /api/auth/logout',
  'GET /api/auth/me',
  'POST /api/auth/otp/cleanup',
  'POST /api/auth/otp/email/generate',
  'POST /api/auth/otp/email/verify',
  'POST /api/auth/otp/password-reset/generate',
  'POST /api/auth/otp/password-reset/verify',
  'POST /api/auth/otp/phone/generate',
  'POST /api/auth/otp/phone/verify',
  'GET /api/auth/otp/person/{{createdPersonId}}',
  'GET /api/auth/otp/person/{{createdPersonId}}/active',
  'POST /api/auth/otp/person/{{createdPersonId}}/invalidate',
  'GET /api/auth/otp/stats',
  'GET /api/auth/profile',
  'POST /api/auth/refresh',
  'POST /api/auth/refresh-token',
  'POST /api/auth/register',
  'POST /api/auth/resend-otp',
  'POST /api/auth/reset-password',
  'GET /api/auth/reset-password', // Ajoutée
  'POST /api/auth/validate-token',
  'POST /api/auth/verify-email',
  
  // Authorization routes
  'POST /api/authorizations/cache/create',
  'POST /api/authorizations/cache/invalidate',
  'GET /api/authorizations/permissions/dependencies',
  'GET /api/authorizations/policy',
  'GET /api/authorizations/roles/hierarchy',
  'GET /api/authorizations/user/{{createdUserId}}',
  'GET /api/authorizations/user/{{createdUserId}}/effective',
  'GET /api/authorizations/user/{{createdUserId}}/highest-role',
  'GET /api/authorizations/user/{{createdUserId}}/is-admin',
  'GET /api/authorizations/verify/all/users.create,users.read',
  'GET /api/authorizations/verify/any/users.create,users.read',
  'GET /api/authorizations/verify/menu/{{createdMenuId}}',
  'GET /api/authorizations/verify/resource/users',
  'GET /api/authorizations/verify/role/admin',
  'GET /api/authorizations/verify/role/all/admin,manager',
  'GET /api/authorizations/verify/role/any/admin,manager',
  'GET /api/authorizations/verify/users.create',
  
  // Menus routes
  'GET /api/menus',
  'GET /api/menus/{{createdMenuId}}',
  'GET /api/menus/{{createdMenuId}}/access',
  'POST /api/menus/{{createdMenuId}}/duplicate',
  'GET /api/menus/{{createdMenuId}}/permissions',
  'GET /api/menus/{{createdMenuId}}/permissions/{{createdPermissionId}}',
  'GET /api/menus/hidden',
  'GET /api/menus/parent/{{createdMenuId}}',
  'POST /api/menus/reorder',
  'GET /api/menus/root',
  'GET /api/menus/root-only',
  'GET /api/menus/stats',
  'GET /api/menus/status/active',
  'GET /api/menus/tree',
  'GET /api/menus/user/{{createdUserId}}',
  'GET /api/menus/visible',
  
  // People routes
  'GET /api/people',
  'GET /api/people/{{createdPersonId}}',
  'POST /api/people/{{createdPersonId}}/status',
  'GET /api/people/email/{{userEmail}}',
  'GET /api/people/exists/{{createdPersonId}}',
  'GET /api/people/phone/+1234567890',
  'GET /api/people/search',
  'GET /api/people/stats',
  'GET /api/people/status/active',
  
  // Permissions routes
  'GET /api/permissions',
  'GET /api/permissions/{{createdPermissionId}}',
  'POST /api/permissions/custom',
  'POST /api/permissions/generate',
  'GET /api/permissions/group/users',
  'GET /api/permissions/resources',
  'GET /api/permissions/resources/users/actions',
  'GET /api/permissions/role/{{createdRoleId}}',
  'GET /api/permissions/stats',
  'GET /api/permissions/system',
  'GET /api/permissions/user/{{createdUserId}}',
  'GET /api/permissions/user/{{createdUserId}}/all/users.create,users.read',
  'GET /api/permissions/user/{{createdUserId}}/any/users.create,users.read',
  'GET /api/permissions/user/{{createdUserId}}/check/users.create',
  
  // Roles routes
  'GET /api/roles',
  'GET /api/roles/{{createdRoleId}}',
  'POST /api/roles/{{createdRoleId}}/duplicate',
  'GET /api/roles/{{createdRoleId}}/permissions',
  'GET /api/roles/{{createdRoleId}}/permissions/{{createdPermissionId}}',
  'GET /api/roles/{{createdRoleId}}/users',
  'GET /api/roles/level/2',
  'GET /api/roles/non-system',
  'GET /api/roles/stats',
  'GET /api/roles/system',
  'GET /api/roles/user/{{createdUserId}}',
  'GET /api/roles/user/{{createdUserId}}/check/admin',
  'GET /api/roles/user/{{createdUserId}}/highest',
  
  // Session monitoring routes
  'GET /api/session-monitoring/active',
  'GET /api/session-monitoring/activity/{{createdUserId}}',
  'GET /api/session-monitoring/anomalies',
  'GET /api/session-monitoring/blacklisted',
  'POST /api/session-monitoring/cleanup',
  'GET /api/session-monitoring/concurrent/{{createdUserId}}',
  'GET /api/session-monitoring/geolocation/{{createdUserId}}',
  'GET /api/session-monitoring/limits/{{createdUserId}}',
  'POST /api/session-monitoring/revoke/{{createdUserId}}',
  'GET /api/session-monitoring/stats',
  'GET /api/session-monitoring/suspicious',
  'GET /api/session-monitoring/user/{{createdUserId}}',
  
  // Sessions routes
  'GET /api/sessions',
  'GET /api/sessions/active/count',
  'GET /api/sessions/current',
  'GET /api/sessions/device/mobile',
  'GET /api/sessions/expired',
  'GET /api/sessions/history/{{createdUserId}}',
  'GET /api/sessions/ip/192.168.1.1',
  'POST /api/sessions/logout',
  'POST /api/sessions/logout-all',
  'POST /api/sessions/password-reset/generate',
  'POST /api/sessions/refresh',
  'POST /api/sessions/revoke',
  'POST /api/sessions/revoke-all/{{createdUserId}}',
  'GET /api/sessions/stats',
  'GET /api/sessions/user/{{createdUserId}}',
  'POST /api/sessions/validate',
  
  // System routes
  'GET /api/system/cache',
  'GET /api/system/config',
  'GET /api/system/database',
  'GET /api/system/info',
  'GET /api/system/status',
  
  // Test routes
  'POST /api/test/password-strength', // Ajoutée
  
  // Users routes
  'GET /api/users',
  'POST /api/users/authenticate',
  'GET /api/users/check/email/test@example.com',
  'GET /api/users/check/username/johndoe',
  'GET /api/users/{{createdUserId}}',
  'GET /api/users/{{createdUserId}}/exists',
  'POST /api/users/{{createdUserId}}/password',
  'POST /api/users/{{createdUserId}}/status',
  'GET /api/users/email/{{userEmail}}',
  'POST /api/users/reset-password',
  'GET /api/users/search',
  'GET /api/users/stats',
  'GET /api/users/username/johndoe'
];

// Normaliser les routes Postman
const normalizedPostmanRoutes = postmanRoutes.map(route => {
  return route
    .replace(/\{\{[^}]+\}\}/g, ':param')
    .replace(/\/[^\/]*\{param\}\/[^\/]*\{param\}/g, '/:param1/:param2')
    .replace(/\/[^\/]*\{param\}/g, '/:param');
});

console.log('=== ANALYSE COMPARATIVE DES ROUTES ===');
console.log(`Total routes Postman: ${normalizedPostmanRoutes.length}`);

// Analyser les fichiers de routes existants
const routesDir = '/home/hbelkassim/dev/ginutech/web_dev/event-planner-saas/event-planner-backend/event-planner-auth/src/modules';
const existingRoutes = new Set();

function extractRoutesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const routeMatches = content.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    
    if (routeMatches) {
      routeMatches.forEach(match => {
        const route = match.match(/['"`]([^'"`]+)['"`]/)[1];
        existingRoutes.add(route);
      });
    }
  } catch (error) {
    console.warn(`Impossible de lire ${filePath}:`, error.message);
  }
}

// Parcourir tous les fichiers de routes
if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir)
    .filter(file => file.endsWith('.routes.js'))
    .map(file => path.join(routesDir, file));
  
  routeFiles.forEach(extractRoutesFromFile);
}

console.log(`Total routes existantes: ${existingRoutes.size}`);

// Trouver les routes manquantes
const missingRoutes = normalizedPostmanRoutes.filter(route => {
  const [method, path] = route.split(' ');
  return !existingRoutes.has(path);
});

console.log(`\n=== ROUTES MANQUANTES (${missingRoutes.length}) ===`);
missingRoutes.forEach((route, i) => {
  console.log(`${i + 1}. ${route}`);
});

// Analyser par module pour identifier les fichiers à modifier/créer
const missingByModule = {};
missingRoutes.forEach(route => {
  const [method, path] = route.split(' ');
  let module = 'unknown';
  
  if (path.startsWith('/api/auth/')) module = 'auth';
  else if (path.startsWith('/api/authorizations/')) module = 'authorizations';
  else if (path.startsWith('/api/menus/')) module = 'menus';
  else if (path.startsWith('/api/people/')) module = 'people';
  else if (path.startsWith('/api/permissions/')) module = 'permissions';
  else if (path.startsWith('/api/roles/')) module = 'roles';
  else if (path.startsWith('/api/session-monitoring/')) module = 'session-monitoring';
  else if (path.startsWith('/api/sessions/')) module = 'sessions';
  else if (path.startsWith('/api/system/')) module = 'system';
  else if (path.startsWith('/api/test/')) module = 'test';
  else if (path.startsWith('/api/users/')) module = 'users';
  
  if (!missingByModule[module]) missingByModule[module] = [];
  missingByModule[module].push(route);
});

console.log('\n=== ROUTES MANQUANTES PAR MODULE ===');
Object.entries(missingByModule).forEach(([module, routes]) => {
  console.log(`\n${module.toUpperCase()} (${routes.length} routes):`);
  routes.forEach((route, i) => {
    console.log(`  ${i + 1}. ${route}`);
  });
});

console.log('\n=== ACTION RECOMMANDÉE ===');
console.log('1. Créer les modules manquants (system, session-monitoring)');
console.log('2. Ajouter les routes manquantes aux modules existants');
console.log('3. Prioriser les routes critiques (auth, users)');
