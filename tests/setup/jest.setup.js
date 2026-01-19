// Configuration Jest pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only_32_chars';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'event_planner_auth';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';

// Configuration pour les services externes (optionnels en test)
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test_password';

// Configuration logging
process.env.LOG_MAX_SIZE = '20MB';
process.env.LOG_MAX_FILES = '14d';

// Mock des services externes pour éviter les dépendances réelles
jest.mock('../../src/services/email.service');
jest.mock('../../src/utils/logger');

// Timeout global pour les tests
jest.setTimeout(10000);
