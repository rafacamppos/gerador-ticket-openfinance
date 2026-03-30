const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..', '..');
const projectEnvPath = path.join(projectRoot, '.env');

dotenv.config({ path: projectEnvPath });

module.exports = {
  port: Number(process.env.PORT) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'open-finance-local-session-secret',
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS) || 43200,
  sessionCookieSecure:
    String(process.env.SESSION_COOKIE_SECURE || '').trim().toLowerCase() === 'true',
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
