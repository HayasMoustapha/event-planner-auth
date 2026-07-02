/**
 * Jest globalSetup — provisions an ISOLATED, clean auth test database once before the suite.
 * Provisioning logic lives in db-provision.js (shared with the per-file reset in jest.reset.js).
 * NEVER touches the dev database.
 */
const { createFreshDb } = require('./db-provision');

module.exports = createFreshDb;
