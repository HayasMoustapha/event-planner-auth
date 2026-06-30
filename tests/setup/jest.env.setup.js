/**
 * Non-credential test bootstrap.
 * Runs as a jest `setupFiles` (before any module import). dotenv.config() does NOT
 * override already-set env vars, so blanking external-provider creds here forces the
 * services' built-in NODE_ENV==='test' "no provider configured -> mock + log code" path.
 * DB_* and REDIS_* are intentionally left unset so dotenv fills them from .env (live local).
 * This proves integration LOGIC against the real DB without real Twilio/SMTP/SendGrid creds.
 */
process.env.NODE_ENV = 'test';

// Disable real SMS providers (Twilio / Vonage)
process.env.TWILIO_ACCOUNT_SID = '';
process.env.TWILIO_AUTH_TOKEN = '';
process.env.TWILIO_PHONE_NUMBER = '';
process.env.VONAGE_API_KEY = '';
process.env.VONAGE_API_SECRET = '';
process.env.VONAGE_FROM_NUMBER = '';

// Disable real email providers (SMTP / SendGrid)
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.SMTP_PASSWORD = '';
process.env.SENDGRID_API_KEY = '';

// Force IPv4 Redis (localhost->::1 times out; redis listens on 127.0.0.1:6379)
process.env.REDIS_HOST = '127.0.0.1';
