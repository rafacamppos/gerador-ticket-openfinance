const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadService({ enabled, repository, logger }) {
  const serviceModulePath = path.resolve(
    __dirname,
    '../../src/services/ticketOwnerClassificationService.js'
  );
  const envModulePath = path.resolve(__dirname, '../../src/config/env.js');
  const repositoryModulePath = path.resolve(__dirname, '../../src/repositories/ticketOwnerRepository.js');
  const loggerModulePath = path.resolve(__dirname, '../../src/utils/logger.js');

  const originalServiceModule = require.cache[serviceModulePath];
  const originalEnvModule = require.cache[envModulePath];
  const originalRepositoryModule = require.cache[repositoryModulePath];
  const originalLoggerModule = require.cache[loggerModulePath];

  delete require.cache[serviceModulePath];
  delete require.cache[envModulePath];
  delete require.cache[repositoryModulePath];
  delete require.cache[loggerModulePath];

  require.cache[envModulePath] = {
    id: envModulePath,
    filename: envModulePath,
    loaded: true,
    exports: {
      ticketOwnerClassificationEnabled: enabled,
    },
  };
  require.cache[repositoryModulePath] = {
    id: repositoryModulePath,
    filename: repositoryModulePath,
    loaded: true,
    exports: repository,
  };
  require.cache[loggerModulePath] = {
    id: loggerModulePath,
    filename: loggerModulePath,
    loaded: true,
    exports: logger,
  };

  const service = require(serviceModulePath);

  return {
    service,
    restore() {
      if (originalServiceModule) require.cache[serviceModulePath] = originalServiceModule;
      else delete require.cache[serviceModulePath];
      if (originalEnvModule) require.cache[envModulePath] = originalEnvModule;
      else delete require.cache[envModulePath];
      if (originalRepositoryModule) require.cache[repositoryModulePath] = originalRepositoryModule;
      else delete require.cache[repositoryModulePath];
      if (originalLoggerModule) require.cache[loggerModulePath] = originalLoggerModule;
      else delete require.cache[loggerModulePath];
    },
  };
}

test('classifyTickets returns input when feature is disabled', async () => {
  const tickets = [{ ticket: { id: '10' } }];
  const { service, restore } = loadService({
    enabled: false,
    repository: {},
    logger: { error() {} },
  });

  try {
    const response = await service.classifyTickets(tickets);
    assert.strictEqual(response, tickets);
  } finally {
    restore();
  }
});

test('classifyTickets caches owners and rules between calls', async () => {
  let ownersCalls = 0;
  let rulesCalls = 0;
  const { service, restore } = loadService({
    enabled: true,
    repository: {
      async listActiveOwners() {
        ownersCalls += 1;
        return [
          { id: 1, slug: 'owner-a', name: 'Owner A', is_fallback_owner: false },
          { id: 2, slug: 'su', name: 'SU', is_fallback_owner: true },
        ];
      },
      async listActiveRules() {
        rulesCalls += 1;
        return [
          {
            ticket_owner_id: 1,
            rule_group_code: 'status-group',
            logical_operator: 'AND',
            field_code: 'status',
            operator: 'equals',
            expected_value: 'NOVO',
            priority_order: 1,
          },
        ];
      },
    },
    logger: { error() {} },
  });

  try {
    await service.classifyTickets([{ ticket: { status: 'NOVO' } }]);
    await service.classifyTickets([{ ticket: { status: 'NOVO' } }]);

    assert.strictEqual(ownersCalls, 1);
    assert.strictEqual(rulesCalls, 1);
  } finally {
    restore();
  }
});

test('classifyTickets falls back when classification is unavailable', async () => {
  const loggerCalls = [];
  const { service, restore } = loadService({
    enabled: true,
    repository: {
      async listActiveOwners() {
        throw new Error('db unavailable');
      },
      async listActiveRules() {
        return [];
      },
    },
    logger: {
      error(message, context) {
        loggerCalls.push({ message, context });
      },
    },
  });

  try {
    const response = await service.classifyTickets([{ ticket: { id: '10' } }]);
    assert.strictEqual(response[0].routing.resolution_type, 'classification_unavailable');
    assert.strictEqual(response[0].routing.owner_slug, 'su-super-usuarios');
    assert.deepStrictEqual(loggerCalls[0], {
      message: 'Ticket owner classification failed',
      context: {
        errorMessage: 'db unavailable',
      },
    });
  } finally {
    restore();
  }
});

test('classifyTicket returns classified single ticket', async () => {
  const { service, restore } = loadService({
    enabled: true,
    repository: {
      async listActiveOwners() {
        return [
          { id: 1, slug: 'owner-a', name: 'Owner A', is_fallback_owner: false },
          { id: 2, slug: 'su', name: 'SU', is_fallback_owner: true },
        ];
      },
      async listActiveRules() {
        return [
          {
            ticket_owner_id: 1,
            rule_group_code: 'status-group',
            logical_operator: 'AND',
            field_code: 'status',
            operator: 'equals',
            expected_value: 'NOVO',
            priority_order: 1,
          },
        ];
      },
    },
    logger: { error() {} },
  });

  try {
    const response = await service.classifyTicket({ ticket: { status: 'NOVO' } });
    assert.strictEqual(response.routing.owner_slug, 'owner-a');
  } finally {
    restore();
  }
});
