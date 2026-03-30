const openFinanceService = require('../services/openFinanceService');
const {
  getDefaultEnvironment,
  listAvailableEnvironments,
  resolveEnvironment,
} = require('../services/openFinanceEnvironmentService');
const logger = require('../utils/logger');

function ensureOpenFinanceSession(req, headers) {
  const sessionState = req.session && req.session.openFinanceSession;

  if (!headers.cookie && sessionState && sessionState.cookie) {
    headers.cookie = sessionState.cookie;
  }

  if (!headers.cache && sessionState && sessionState.cache) {
    headers.cache = sessionState.cache;
  }

  return headers;
}

function getForwardHeaders(req) {
  const headers = {};

  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  return ensureOpenFinanceSession(req, headers);
}

function isCaptchaSessionErrorDetails(details) {
  if (!details) {
    return false;
  }

  if (typeof details === 'string') {
    return /wrong captcha/i.test(details);
  }

  if (typeof details.message === 'string' && /wrong captcha/i.test(details.message)) {
    return true;
  }

  return false;
}

function shouldRefreshManagedSession(error) {
  if (error?.status === 401) {
    return true;
  }

  return error?.status === 500 && isCaptchaSessionErrorDetails(error.details);
}

function hasStoredOpenFinanceSession(req) {
  const sessionState = req.session && req.session.openFinanceSession;
  return Boolean(sessionState?.cookie || sessionState?.cache);
}

function storeOpenFinanceSession(req, sessionState) {
  if (req.session) {
    req.session.openFinanceSession = sessionState || null;
  }
}

async function persistSession(req) {
  if (!req.session || typeof req.session.save !== 'function') {
    return;
  }

  await new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function getStoredEnvironment(req) {
  return (
    resolveEnvironment(req.session?.openFinanceEnvironmentBaseUrl) ||
    getDefaultEnvironment()
  );
}

function getRequestContext(req) {
  const environment = getStoredEnvironment(req);

  return {
    environmentBaseUrl: environment.baseUrl,
  };
}

function formatEnvironmentState(req) {
  const currentEnvironment = getStoredEnvironment(req);

  return {
    current: {
      key: currentEnvironment.key,
      label: currentEnvironment.label,
      baseUrl: currentEnvironment.baseUrl,
    },
    available: listAvailableEnvironments(),
  };
}

async function createManagedOpenFinanceSession(req, context) {
  const response = await openFinanceService.createSession({}, context);
  storeOpenFinanceSession(req, response.sessionState);
  await persistSession(req);

  logger.info('Open Finance session refreshed automatically', {
    requestId: req.requestId || null,
    route: 'autoSessionRefresh',
    hasCookie: Boolean(response.sessionState?.cookie),
    hasCache: Boolean(response.sessionState?.cache),
  });

  return response.sessionState;
}

async function executeWithManagedSession(req, operation) {
  const context = getRequestContext(req);

  if (!hasStoredOpenFinanceSession(req)) {
    await createManagedOpenFinanceSession(req, context);
  }

  try {
    return await operation(getForwardHeaders(req), context);
  } catch (error) {
    if (!shouldRefreshManagedSession(error)) {
      throw error;
    }

    storeOpenFinanceSession(req, null);
    await createManagedOpenFinanceSession(req, context);
    return operation(getForwardHeaders(req), context);
  }
}

module.exports = {
  executeWithManagedSession,
  formatEnvironmentState,
  getRequestContext,
  persistSession,
  shouldRefreshManagedSession,
  storeOpenFinanceSession,
  resolveEnvironment,
  listAvailableEnvironments,
};
