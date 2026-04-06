const test = require('node:test');
const assert = require('node:assert');

const controller = require('../../src/controllers/openFinanceEnvironmentController');
const { createMockResponse } = require('../helpers/testHelpers');

test('getEnvironment returns the current environment and the available options', async () => {
  const req = {
    session: {},
  };
  const res = createMockResponse();

  await controller.getEnvironment(req, res, (error) => {
    throw error;
  });

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.current, {
    key: 'production',
    label: 'PRODUCAO',
    baseUrl: 'https://servicedesksandbox.openfinancebrasil.org.br',
  });
});

test('updateEnvironment stores the selected environment and clears the upstream session', async () => {
  const req = {
    body: {
      environmentKey: 'homologation',
    },
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  await controller.updateEnvironment(req, res, (error) => {
    throw error;
  });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(
    req.session.openFinanceEnvironmentBaseUrl,
    'https://servicedesksandbox.openfinancebrasil.org.br'
  );
  assert.strictEqual(req.session.openFinanceSession, null);
});
