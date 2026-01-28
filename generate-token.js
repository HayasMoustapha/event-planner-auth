#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Lire le secret JWT partagé
const secretPath = '/home/hbelkassim/dev/ginutech/web_dev/event-planner-saas/event-planner-backend/shared/.jwt-secret';
const secret = fs.readFileSync(secretPath, 'utf8').trim();

// Payload avec tous les rôles et permissions
const payload = {
  id: "1",
  email: "admin@eventplanner.com",
  username: "admin",
  status: "active",
  type: "access",
  roles: [
    "admin",
    "super_admin", 
    "organizer",
    "event_manager",
    "designer",
    "participant",
    "staff",
    "user"
  ],
  permissions: ["*"], // Toutes les permissions
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 heures
  iss: "auth-service",
  aud: "event-planner"
};

// Générer le token
const token = jwt.sign(payload, secret, {
  algorithm: 'HS256'
});

console.log('Token JWT avec tous les rôles:');
console.log(token);
console.log('\nPayload décodé:');
console.log(JSON.stringify(jwt.decode(token), null, 2));
