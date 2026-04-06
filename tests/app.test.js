const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');

const logger = require('../src/utils/logger');
const { createApp } = require('../src/app');

function invokeApp(app, { method = 'GET', url = '/', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = headers;
    req.socket = { remoteAddress: '127.0.0.1' };

    const res = new EventEmitter();
    res.statusCode = 200;
    res.headers = {};
    res.locals = {};
    res.setHeader = (name, value) => {
      res.headers[name] = value;
    };
    res.getHeader = (name) => res.headers[name];
    res.removeHeader = (name) => {
      delete res.headers[name];
    };
    res.writeHead = (statusCode, headersToSet) => {
      res.statusCode = statusCode;
      Object.entries(headersToSet || {}).forEach(([name, value]) => {
        res.setHeader(name, value);
      });
    };
    res.write = (chunk) => {
      res.body = (res.body || '') + chunk;
    };
    res.end = (chunk) => {
      if (chunk) {
        res.write(chunk);
      }
      res.emit('finish');
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: res.body || '',
      });
    };

    app.handle(req, res, reject);
  });
}

test('createApp throws when sessionMiddleware is not provided', () => {
  assert.throws(() => createApp(), /sessionMiddleware must be provided/i);
});

test('createApp responds to health check', async () => {
  const app = createApp({
    sessionMiddleware(req, _res, next) {
      req.session = {};
      next();
    },
  });

  const response = await invokeApp(app, {
    method: 'GET',
    url: '/health',
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(response.body), { status: 'ok' });
});

test('createApp error middleware logs and returns structured payload', async () => {
  const originalLoggerError = logger.error;
  const calls = [];
  logger.error = (message, context) => {
    calls.push({ message, context });
  };

  const app = createApp({
    sessionMiddleware(req, _res, next) {
      const error = new Error('Falha controlada');
      error.status = 418;
      error.details = { source: 'test' };
      req.requestId = 'req-app-test';
      next(error);
    },
  });

  try {
    const response = await invokeApp(app, {
      method: 'GET',
      url: '/health',
    });

    assert.strictEqual(response.statusCode, 418);
    assert.deepStrictEqual(JSON.parse(response.body), {
      message: 'Falha controlada',
      details: { source: 'test' },
    });
    assert.deepStrictEqual(calls[0], {
      message: 'HTTP request failed',
      context: {
        requestId: 'req-app-test',
        method: 'GET',
        path: '/health',
        statusCode: 418,
        errorMessage: 'Falha controlada',
        errorDetails: { source: 'test' },
      },
    });
  } finally {
    logger.error = originalLoggerError;
  }
});
