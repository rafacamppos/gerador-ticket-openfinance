const test = require('node:test');
const assert = require('node:assert');

const logger = require('../../src/utils/logger');
const requestLoggingMiddleware = require('../../src/middleware/requestLoggingMiddleware');

test('requestLoggingMiddleware reuses incoming request id and logs start and finish', () => {
  const originalInfo = logger.info;
  const originalCreateRequestId = logger.createRequestId;
  const originalDateNow = Date.now;

  const logs = [];
  let finishHandler = null;
  let nowCall = 0;

  logger.info = (message, context) => {
    logs.push({ message, context });
  };
  logger.createRequestId = () => {
    throw new Error('createRequestId should not be called');
  };
  Date.now = () => {
    nowCall += 1;
    return nowCall === 1 ? 1000 : 1125;
  };

  const req = {
    headers: {
      'x-request-id': 'req-123',
      'x-forwarded-for': '10.0.0.1',
      'user-agent': 'node-test',
    },
    method: 'POST',
    originalUrl: '/api/v1/open-finance/tickets',
    session: {
      portalUser: {
        id: '44',
      },
    },
    body: {
      ticketId: '777',
    },
  };
  const res = {
    statusCode: 201,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    on(eventName, handler) {
      if (eventName === 'finish') {
        finishHandler = handler;
      }
    },
  };
  let nextCalled = false;

  try {
    requestLoggingMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.requestId, 'req-123');
    assert.strictEqual(res.headers['X-Request-Id'], 'req-123');
    assert.strictEqual(typeof finishHandler, 'function');
    assert.strictEqual(logs.length, 1);
    assert.deepStrictEqual(logs[0], {
      message: 'HTTP request started',
      context: {
        requestId: 'req-123',
        userId: '44',
        ticketId: '777',
        method: 'POST',
        path: '/api/v1/open-finance/tickets',
        ip: '10.0.0.1',
        userAgent: 'node-test',
      },
    });

    finishHandler();

    assert.strictEqual(logs.length, 2);
    assert.deepStrictEqual(logs[1], {
      message: 'HTTP request completed',
      context: {
        requestId: 'req-123',
        userId: '44',
        ticketId: '777',
        method: 'POST',
        path: '/api/v1/open-finance/tickets',
        statusCode: 201,
        durationMs: 125,
      },
    });
  } finally {
    logger.info = originalInfo;
    logger.createRequestId = originalCreateRequestId;
    Date.now = originalDateNow;
  }
});

test('requestLoggingMiddleware generates request id and falls back to socket ip', () => {
  const originalInfo = logger.info;
  const originalCreateRequestId = logger.createRequestId;

  const logs = [];
  logger.info = (message, context) => {
    logs.push({ message, context });
  };
  logger.createRequestId = () => 'generated-req-id';

  const req = {
    headers: {},
    method: 'GET',
    originalUrl: '/health',
    socket: {
      remoteAddress: '127.0.0.1',
    },
  };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    on() {},
  };

  try {
    requestLoggingMiddleware(req, res, () => {});

    assert.strictEqual(req.requestId, 'generated-req-id');
    assert.strictEqual(res.headers['X-Request-Id'], 'generated-req-id');
    assert.deepStrictEqual(logs[0], {
      message: 'HTTP request started',
      context: {
        requestId: 'generated-req-id',
        userId: null,
        ticketId: null,
        method: 'GET',
        path: '/health',
        ip: '127.0.0.1',
        userAgent: null,
      },
    });
  } finally {
    logger.info = originalInfo;
    logger.createRequestId = originalCreateRequestId;
  }
});
