/**
 * Regression designer-502 : l'ordre des routes internes /users doit router
 * /users/search et /users/stats vers leurs handlers LITTÉRAUX, et non vers
 * /users/:id (qui faisait parseInt("search")=NaN -> "ID d'utilisateur invalide"
 * -> 502 cote core lors de l'enrichissement batch du marketplace).
 *
 * On monte le VRAI routeur interne avec un controller mocke (aucune base requise).
 */
const express = require('express');
const request = require('supertest');

// Controller mocke : chaque handler repond avec son nom -> on observe le routage.
jest.mock('../../src/modules/users/users.controller', () => ({
  getAll: (req, res) => res.json({ handler: 'getAll' }),
  getById: (req, res) => res.json({ handler: 'getById', id: req.params.id }),
  getByEmail: (req, res) => res.json({ handler: 'getByEmail' }),
  getByUsername: (req, res) => res.json({ handler: 'getByUsername' }),
  search: (req, res) => res.json({ handler: 'search' }),
  getStats: (req, res) => res.json({ handler: 'getStats' }),
  exists: (req, res) => res.json({ handler: 'exists' }),
}));

const internalRoutes = require('../../src/modules/auth/internal.routes');

const TOKEN = process.env.SHARED_SERVICE_TOKEN || 'shared-service-token-abcdef12345678901234567890';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/internal/auth', internalRoutes);
  return app;
}

const get = (app, path) =>
  request(app).get(path).set('X-Service-Token', TOKEN);

describe('internal /users route ordering (regression designer-502)', () => {
  const app = makeApp();

  it('GET /users/search -> handler "search" (pas getById)', async () => {
    const res = await get(app, '/api/internal/auth/users/search');
    expect(res.status).toBe(200);
    expect(res.body.handler).toBe('search');
  });

  it('GET /users/stats -> handler "getStats" (pas getById)', async () => {
    const res = await get(app, '/api/internal/auth/users/stats');
    expect(res.status).toBe(200);
    expect(res.body.handler).toBe('getStats');
  });

  it('GET /users/:id numerique -> handler "getById" (toujours fonctionnel)', async () => {
    const res = await get(app, '/api/internal/auth/users/123');
    expect(res.status).toBe(200);
    expect(res.body.handler).toBe('getById');
    expect(res.body.id).toBe('123');
  });

  it('le service-token reste exige (securite inter-services preservee)', async () => {
    const res = await request(app).get('/api/internal/auth/users/search');
    expect(res.status).toBe(401);
  });
});
