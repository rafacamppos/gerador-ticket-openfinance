const openFinanceDeskClient = require('../clients/openFinanceDeskClient');
const {
  openFinanceLogLoginPayload,
  openFinanceUsername,
  openFinancePassword,
} = require('../config/env');
const { formatSessionResponse } = require('../utils/openFinanceSessionFormatter');
const logger = require('../utils/logger');
const { buildError } = require('./openFinanceServiceErrors');

function ensureSessionPayload(payload = {}) {
  const userName = String(
    payload.userName || payload.user_name || openFinanceUsername || ''
  ).trim();
  const password = String(payload.password || openFinancePassword || '').trim();

  if (!userName) {
    throw buildError('Open Finance username is not configured.');
  }

  if (!password) {
    throw buildError('Open Finance password is not configured.');
  }

  return {
    user_name: userName,
    password,
  };
}

async function createSession(payload, context) {
  const response = await openFinanceDeskClient.postJsonWithMeta(
    '/login',
    ensureSessionPayload(payload),
    undefined,
    undefined,
    context
  );
  const sessionState = {
    cookie:
      response.headers.setCookie.join('; ') ||
      response.headers.cookie.join('; ') ||
      null,
    cache: response.payload.cache || response.headers.cache || null,
  };

  if (openFinanceLogLoginPayload) {
    const sanitizedPayload = { ...response.payload };
    delete sanitizedPayload.cache;
    delete sanitizedPayload.token;
    delete sanitizedPayload.sessionId;

    logger.debug('Open Finance raw login payload', {
      sanitizedPayload,
      payloadKeys: Object.keys(response.payload || {}),
      hasSessionCookie: Boolean(sessionState.cookie),
      hasSessionCache: Boolean(sessionState.cache),
    });
  }

  return {
    response: formatSessionResponse(response.payload, sessionState),
    sessionState,
  };
}

module.exports = {
  createSession,
};
