const crypto = require('crypto');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const {
  sessionSecret,
  sessionTtlSeconds,
  sessionCookieSecure,
} = require('../config/env');
const { getRedisClient } = require('../clients/redisClient');

const SESSION_COOKIE_NAME = 'open-finance.sid';

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((accumulator, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function createInMemoryTestSessionMiddleware() {
  const sessions = new Map();

  return function inMemoryTestSessionMiddleware(req, res, next) {
    const cookies = parseCookies(req.headers.cookie || '');
    const existingSessionId = cookies[SESSION_COOKIE_NAME];
    const sessionId = existingSessionId || crypto.randomBytes(24).toString('hex');

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {});
    }

    req.session = sessions.get(sessionId);

    if (!existingSessionId) {
      res.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
      );
    }

    next();
  };
}

function createRedisSessionStore({ redisClient = getRedisClient() } = {}) {
  return redisClient.connect().then(() =>
    new RedisStore({
      client: redisClient,
      prefix: 'open-finance:sess:',
      ttl: sessionTtlSeconds,
    })
  );
}

function createExpressSessionMiddleware(store) {
  return session({
    name: SESSION_COOKIE_NAME,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: sessionCookieSecure,
      maxAge: sessionTtlSeconds * 1000,
    },
  });
}

async function createDefaultSessionMiddleware() {
  if (process.env.NODE_ENV === 'test') {
    return createInMemoryTestSessionMiddleware();
  }

  const redisStore = await createRedisSessionStore();
  return createExpressSessionMiddleware(redisStore);
}

module.exports = {
  SESSION_COOKIE_NAME,
  parseCookies,
  createInMemoryTestSessionMiddleware,
  createRedisSessionStore,
  createExpressSessionMiddleware,
  createDefaultSessionMiddleware,
};
