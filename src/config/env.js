const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..', '..');
const projectEnvPath = path.join(projectRoot, '.env');

dotenv.config({ path: projectEnvPath });

function loadJsonSecrets(projectDirectory) {
  const configuredSecretsFile = String(process.env.SECRETS_FILE || '.secrets.local.json').trim();
  if (!configuredSecretsFile) {
    return {};
  }

  const secretsFilePath = path.resolve(projectDirectory, configuredSecretsFile);
  if (!fs.existsSync(secretsFilePath)) {
    return {};
  }

  try {
    const rawFile = fs.readFileSync(secretsFilePath, 'utf8');
    const parsedFile = JSON.parse(rawFile);
    return parsedFile && typeof parsedFile === 'object' && !Array.isArray(parsedFile)
      ? parsedFile
      : {};
  } catch {
    return {};
  }
}

const jsonSecrets = loadJsonSecrets(projectRoot);

function resolveEnvValue(key, fallback = '') {
  if (process.env[key] !== undefined && process.env[key] !== '') {
    return process.env[key];
  }

  if (jsonSecrets[key] !== undefined && jsonSecrets[key] !== null && jsonSecrets[key] !== '') {
    return String(jsonSecrets[key]);
  }

  return fallback;
}

module.exports = {
  port: Number(resolveEnvValue('PORT')) || 3000,
  sessionSecret: resolveEnvValue('SESSION_SECRET', 'open-finance-local-session-secret'),
  sessionTtlSeconds: Number(resolveEnvValue('SESSION_TTL_SECONDS')) || 43200,
  sessionCookieSecure:
    String(resolveEnvValue('SESSION_COOKIE_SECURE')).trim().toLowerCase() === 'true',
  redisUrl: resolveEnvValue('REDIS_URL', 'redis://localhost:6379'),
  frontendOrigin: resolveEnvValue('FRONTEND_ORIGIN', 'http://localhost:4200'),
  openFinanceUsername: resolveEnvValue('OPEN_FINANCE_USERNAME'),
  openFinancePassword: resolveEnvValue('OPEN_FINANCE_PASSWORD'),
  openFinanceLogLoginPayload:
    String(resolveEnvValue('OPEN_FINANCE_LOG_LOGIN_PAYLOAD')).trim().toLowerCase() === 'true',
  ticketOwnerClassificationEnabled:
    String(resolveEnvValue('TICKET_OWNER_CLASSIFICATION_ENABLED')).trim().toLowerCase() === 'true',
  databaseHost: resolveEnvValue('DATABASE_HOST', 'localhost'),
  databasePort: Number(resolveEnvValue('DATABASE_PORT')) || 5440,
  databaseName: resolveEnvValue('DATABASE_NAME', 'gerador_ticket_openfinance'),
  databaseUser: resolveEnvValue('DATABASE_USER', 'gerador_ticket_user'),
  databasePassword: resolveEnvValue('DATABASE_PASSWORD', 'gerador_ticket_password'),
  openFinanceApiBaseUrl: (
    resolveEnvValue('OPEN_FINANCE_API_BASE_URL') ||
    'https://servicedesk.openfinancebrasil.org.br'
  ).replace(/\/+$/, ''),
};
