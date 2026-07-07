/**
 * Shared provisioning for the ISOLATED auth test database (event_planner_auth_test).
 *
 * - createFreshDb(): drop + recreate the DB and apply bootstrap + migrations + seeds (used once by
 *   jest globalSetup).
 * - resetData(): TRUNCATE every table and re-apply the seed baseline (used per test FILE, before its
 *   tests, so each file starts from an identical seeded slate). Combined with maxWorkers:1 this makes
 *   the suite hermetic without rewriting every fixture: intra-file state chains (register->login) are
 *   preserved, cross-file fixture collisions are eliminated.
 *
 * NEVER touches the dev database.
 */
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const CFG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};
const TEST_DB = process.env.DB_NAME_OVERRIDE || 'event_planner_auth_test';
const ROOT = path.join(__dirname, '../..');

const SCHEMA_FILES = [
  'database/bootstrap/001_create_schema_migrations.sql',
  'database/migrations/001_auth_schema.sql',
  'database/migrations/002_add_user_preferences.sql',
  'database/migrations/003_harden_session_storage.sql',
];
const SEED_FILES = [
  'database/seeds/seeds/roles.seed.sql',
  'database/seeds/seeds/permissions.seed.sql',
  'database/seeds/seeds/menus.seed.sql',
  'database/seeds/seeds/authorizations.seed.sql',
  'database/seeds/seeds/admin.seed.sql',
];

function readSql(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`[auth db-provision] missing SQL file: ${rel}`);
  return fs.readFileSync(abs, 'utf8');
}

async function apply(db, files) {
  for (const rel of files) {
    try {
      await db.query(readSql(rel));
    } catch (e) {
      throw new Error(`[auth db-provision] failed applying ${rel}: ${e.message}`);
    }
  }
}

async function createFreshDb() {
  const admin = new Client({ ...CFG, database: 'postgres' });
  await admin.connect();
  await admin.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [TEST_DB]
  );
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  const db = new Client({ ...CFG, database: TEST_DB });
  await db.connect();
  await apply(db, SCHEMA_FILES);
  await apply(db, SEED_FILES);
  await db.end();
  // eslint-disable-next-line no-console
  console.log(`[auth db-provision] provisioned clean ${TEST_DB}`);
}

async function resetData() {
  const db = new Client({ ...CFG, database: TEST_DB });
  await db.connect();
  const { rows } = await db.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migrations'`
  );
  if (rows.length) {
    const list = rows.map((r) => `"${r.tablename}"`).join(', ');
    await db.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  }
  await apply(db, SEED_FILES);
  await db.end();
}

module.exports = { createFreshDb, resetData, TEST_DB };
