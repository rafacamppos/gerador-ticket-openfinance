const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadRepositoryWithPool(pool) {
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/incidentTicketRepository.js'
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

test('getIncidentTicketContext queries by owner slug and normalized incident id', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{ id: 10 }],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.getIncidentTicketContext('time-a', '10');

    assert.deepStrictEqual(response, { id: 10 });
    assert.match(captured.text, /FROM application_incidents ai/i);
    assert.match(captured.text, /LIMIT 1/i);
    assert.deepStrictEqual(captured.values, ['time-a', 10]);
  } finally {
    restore();
  }
});

test('getIncidentTicketContext selects created_at and updated_at fields', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{ id: 10 }],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    await repository.getIncidentTicketContext('time-a', '10');

    assert.match(captured.text, /ai\.created_at/i);
    assert.match(captured.text, /ai\.updated_at/i);
  } finally {
    restore();
  }
});

test('getTemplateFields queries ordered fields and returns rows', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{ field_name: 'Campo 1' }],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.getTemplateFields('123328');

    assert.deepStrictEqual(response, [{ field_name: 'Campo 1' }]);
    assert.match(captured.text, /FROM template_fields/i);
    assert.match(captured.text, /ORDER BY id ASC/i);
    assert.deepStrictEqual(captured.values, [123328]);
  } finally {
    restore();
  }
});
