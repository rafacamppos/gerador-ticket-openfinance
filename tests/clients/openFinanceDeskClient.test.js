const test = require('node:test');
const assert = require('node:assert');

const client = require('../../src/clients/openFinanceDeskClient');
const { openFinanceApiBaseUrl } = require('../../src/config/env');

test('createUrl preserves upstream api base path when path starts with slash', () => {
  const url = client.createUrl('/login');

  assert.strictEqual(url.toString(), `${openFinanceApiBaseUrl}/api/v1/login`);
});

test('createUrl appends query string parameters to normalized upstream path', () => {
  const url = client.createUrl('/sr', {
    assigned_group: '10',
    problem_type: 'Incidentes_APIs_Erros',
  });

  assert.strictEqual(
    url.toString(),
    `${openFinanceApiBaseUrl}/api/v1/sr?assigned_group=10&problem_type=Incidentes_APIs_Erros`
  );
});
