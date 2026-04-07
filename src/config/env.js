const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..', '..');
const projectEnvPath = path.join(projectRoot, '.env');

dotenv.config({ path: projectEnvPath });

const DEFAULT_SESSION_SECRET = 'open-finance-local-session-secret';
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  if (isProduction) {
    throw new Error('[config] SESSION_SECRET is required in production. Set a secure random value.');
  }
  // eslint-disable-next-line no-console
  console.warn('[config] SESSION_SECRET not set — using insecure default. Never use this in production.');
}

if (isProduction && !process.env.OPEN_FINANCE_USERNAME) {
  throw new Error('[config] OPEN_FINANCE_USERNAME is required in production.');
}

if (isProduction && !process.env.OPEN_FINANCE_PASSWORD) {
  throw new Error('[config] OPEN_FINANCE_PASSWORD is required in production.');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  sessionSecret: process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET,
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS) || 43200,
  sessionCookieSecure: isProduction
    ? true
    : String(process.env.SESSION_COOKIE_SECURE || '').trim().toLowerCase() === 'true',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  openFinanceUsername: process.env.OPEN_FINANCE_USERNAME || '',
  openFinancePassword: process.env.OPEN_FINANCE_PASSWORD || '',
  openFinanceLogLoginPayload: String(process.env.OPEN_FINANCE_LOG_LOGIN_PAYLOAD || '').trim().toLowerCase() === 'true',
  ticketOwnerClassificationEnabled:
    String(process.env.TICKET_OWNER_CLASSIFICATION_ENABLED || '').trim().toLowerCase() === 'true',
  databaseHost: process.env.DATABASE_HOST || 'localhost',
  databasePort: Number(process.env.DATABASE_PORT) || 5440,
  databaseName: process.env.DATABASE_NAME || 'gerador_ticket_openfinance',
  databaseUser: process.env.DATABASE_USER || 'gerador_ticket_user',
  databasePassword: process.env.DATABASE_PASSWORD || 'gerador_ticket_password',
  openFinanceApiBaseUrl: (
    process.env.OPEN_FINANCE_API_BASE_URL ||
    'https://servicedesk.openfinancebrasil.org.br'
  ).replace(/\/+$/, ''),
};
