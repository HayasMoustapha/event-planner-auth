// Configuration Jest pour les tests
// E-CI(auth) — Charger les vraies variables d'env (.env) AVANT tout : l'ancien
// setup codait en dur DB_PASSWORD='postgres' (erroné) -> "password authentication
// failed" sur tous les tests touchant la base. On charge .env puis on ne fixe que
// des valeurs de repli, sans écraser les creds DB réelles.
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_for_testing_only_32_chars';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'event_planner_auth';
process.env.DB_USER = process.env.DB_USER || 'postgres';
// DB_PASSWORD provient de .env (ne pas coder en dur une valeur erronée).

// Configuration pour les services externes (optionnels en test)
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test_password';

// Configuration logging
process.env.LOG_MAX_SIZE = '20MB';
process.env.LOG_MAX_FILES = '14d';

// Mock des services externes si nécessaire
// jest.mock('../../src/utils/logger'); // On préfère garder le logger pour le debug

// Timeout global pour les tests
jest.setTimeout(60000);

// Nettoyage global après tous les tests
afterAll(async () => {
    // Fermer la connexion à la base de données, sans bloquer indéfiniment
    const { connection } = require('../../src/config/database');
    if (connection && connection.end) {
        const timeoutMs = 5000;
        await Promise.race([
            connection.end(),
            new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ]);
    }
});
