const test = require('node:test');
const assert = require('node:assert');

const corsMiddleware = require('../../src/middleware/corsMiddleware');
const { frontendOrigin } = require('../../src/config/env');
const { createMockResponse } = require('../helpers/testHelpers');

test('corsMiddleware sets CORS headers and calls next for non-OPTIONS requests', () => {
  const req = { method: 'GET' };
  const res = createMockResponse();
  let nextCalled = false;

  corsMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.headers['Access-Control-Allow-Origin'], frontendOrigin);
  assert.strictEqual(res.headers.Vary, 'Origin');
  assert.strictEqual(res.headers['Access-Control-Allow-Credentials'], 'true');
  assert.strictEqual(
    res.headers['Access-Control-Allow-Headers'],
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache, X-Request-Id'
  );
  assert.strictEqual(
    res.headers['Access-Control-Allow-Methods'],
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  assert.strictEqual(res.statusCode, null);
  assert.strictEqual(res.ended, false);
});

test('corsMiddleware returns 204 and does not call next for OPTIONS requests', () => {
  const req = { method: 'OPTIONS' };
  const res = createMockResponse();
  let nextCalled = false;

  corsMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.ended, true);
});
