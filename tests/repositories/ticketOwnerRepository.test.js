const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadRepositoryWithPool(pool) {
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/ticketOwnerRepository.js'
  );
  const postgresClientModulePath = path.resolve(
    __dirname,
    '../../src/clients/postgresClient.js'
  );

  const originalRepositoryModule = require.cache[repositoryModulePath];
  const originalPostgresClientModule = require.cache[postgresClientModulePath];

  delete require.cache[repositoryModulePath];
  delete require.cache[postgresClientModulePath];

  require.cache[postgresClientModulePath] = {
    id: postgresClientModulePath,
    filename: postgresClientModulePath,
    loaded: true,
    exports: {
      getPool: () => pool,
    },
  };

  const repository = require(repositoryModulePath);

  return {
    repository,
    restore() {
      if (originalRepositoryModule) {
        require.cache[repositoryModulePath] = originalRepositoryModule;
      } else {
        delete require.cache[repositoryModulePath];
      }

      if (originalPostgresClientModule) {
        require.cache[postgresClientModulePath] = originalPostgresClientModule;
      } else {
        delete require.cache[postgresClientModulePath];
      }
    },
  };
}

test('listActiveOwners queries active owners ordered by fallback triage and name', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithPool({
    async query(text) {
      captured = text;
      return { rows: [{ id: 1 }] };
    },
  });

  try {
    const response = await repository.listActiveOwners();
    assert.deepStrictEqual(response, [{ id: 1 }]);
    assert.match(captured, /FROM ticket_owners/i);
    assert.match(captured, /WHERE is_active = TRUE/i);
    assert.match(captured, /ORDER BY is_fallback_owner DESC, is_triage_team DESC, name ASC/i);
  } finally {
    restore();
  }
});

test('getActiveOwnerBySlug queries slug and returns first row', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithPool({
    async query(text, values) {
      captured = { text, values };
      return { rows: [{ slug: 'time-a' }] };
    },
  });

  try {
    const response = await repository.getActiveOwnerBySlug('time-a');
    assert.deepStrictEqual(response, { slug: 'time-a' });
    assert.match(captured.text, /WHERE slug = \$1/i);
    assert.deepStrictEqual(captured.values, ['time-a']);
  } finally {
    restore();
  }
});

test('listActiveRules returns active rules ordered by priority and id', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithPool({
    async query(text) {
      captured = text;
      return { rows: [{ id: 10 }] };
    },
  });

  try {
    const response = await repository.listActiveRules();
    assert.deepStrictEqual(response, [{ id: 10 }]);
    assert.match(captured, /FROM ticket_owner_rules/i);
    assert.match(captured, /ORDER BY priority_order ASC, id ASC/i);
  } finally {
    restore();
  }
});
