const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadRepositoryWithPool(pool) {
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/applicationIncidentRepository.js'
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

test('createIncident persists serialized payloads and returns first row', async () => {
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
    const response = await repository.createIncident({
      ticket_owner_id: 7,
      x_fapi_interaction_id: 'fapi-id',
      authorization_server: 'auth-id',
      client_id: 'client-id',
      endpoint: '/consents',
      method: 'POST',
      payload_request: { consentId: '1' },
      payload_response: { error: 'invalid' },
      occurred_at: '2026-03-29T10:15:00.000Z',
      http_status_code: 422,
      title: 'Falha',
      description: 'Erro',
      tipo_cliente: 'PF',
      canal_jornada: 'App to app',
      id_version_api: 3,
      category_name: 'Conformidade',
      sub_category_name: 'Validação',
      third_level_category_name: 'Dados',
    });

    assert.deepStrictEqual(response, { id: 10 });
    assert.match(captured.text, /INSERT INTO application_incidents/i);
    assert.deepStrictEqual(captured.values, [
      7,
      'fapi-id',
      'auth-id',
      'client-id',
      '/consents',
      'POST',
      JSON.stringify({ consentId: '1' }),
      JSON.stringify({ error: 'invalid' }),
      '2026-03-29T10:15:00.000Z',
      422,
      'Falha',
      'Erro',
      'PF',
      'App to app',
      3,
      'Conformidade',
      'Validação',
      'Dados',
    ]);
  } finally {
    restore();
  }
});

test('listIncidentsByOwnerSlug builds pagination clauses and returns rows', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{ id: 1 }, { id: 2 }],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.listIncidentsByOwnerSlug('time-a', {
      limit: 10,
      offset: 20,
    });

    assert.deepStrictEqual(response, [{ id: 1 }, { id: 2 }]);
    assert.match(captured.text, /WHERE towner\.slug = \$1/i);
    assert.match(captured.text, /LIMIT \$2/);
    assert.match(captured.text, /OFFSET \$3/);
    assert.deepStrictEqual(captured.values, ['time-a', 10, 20]);
  } finally {
    restore();
  }
});

test('getIncidentById normalizes incident id and returns null when row is absent', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.getIncidentById('time-a', '33');

    assert.strictEqual(response, null);
    assert.match(captured.text, /AND ai\.id = \$2/i);
    assert.deepStrictEqual(captured.values, ['time-a', 33]);
  } finally {
    restore();
  }
});

test('assignIncidentToUser forwards assignment payload and returns first row', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{ id: 33, assigned_to_user_id: 8 }],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.assignIncidentToUser('time-a', '33', {
      incident_status: 'assigned',
      assigned_to_user_id: 8,
    });

    assert.deepStrictEqual(response, { id: 33, assigned_to_user_id: 8 });
    assert.match(captured.text, /SET incident_status = \$3/i);
    assert.deepStrictEqual(captured.values, ['time-a', 33, 'assigned', 8]);
  } finally {
    restore();
  }
});

test('transitionIncident forwards related ticket id and returns null when row is absent', async () => {
  let captured = null;
  const pool = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.transitionIncident('time-a', '33', {
      incident_status: 'ticket_created',
      related_ticket_id: 123456,
    });

    assert.strictEqual(response, null);
    assert.match(captured.text, /SET incident_status = \$3/i);
    assert.deepStrictEqual(captured.values, ['time-a', 33, 'ticket_created', 123456]);
  } finally {
    restore();
  }
});

test('transitionIncident returns assigned user fields from joined ticket user', async () => {
  const pool = {
    async query() {
      return {
        rows: [
          {
            id: 33,
            assigned_to_user_id: 8,
            assigned_to_name: 'Rafael de Campos',
            assigned_to_email: 'rafael.campos@f1rst.com.br',
          },
        ],
      };
    },
  };
  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const response = await repository.transitionIncident('time-a', '33', {
      incident_status: 'ticket_created',
      related_ticket_id: 123456,
    });

    assert.deepStrictEqual(response, {
      id: 33,
      assigned_to_user_id: 8,
      assigned_to_name: 'Rafael de Campos',
      assigned_to_email: 'rafael.campos@f1rst.com.br',
    });
  } finally {
    restore();
  }
});
