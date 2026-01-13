const { Pool } = require('pg');

const dbConfig = {
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_planner_auth',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  }
};

const connection = new Pool(dbConfig.postgres);

// Test de connexion
connection.on('connect', () => {
  console.log('✅ Connecté à PostgreSQL');
});

connection.on('error', (err) => {
  console.error('❌ Erreur de connexion PostgreSQL:', err);
});

module.exports = {
  connection,
  dbConfig,
  dbType: 'postgres'
};
