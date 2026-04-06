const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadRepositoryWithMocks({ pool, stateQueries, transitionRepository }) {
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/ticketFlowRepository.js'
  );
  const postgresClientModulePath = path.resolve(
    __dirname,
    '../../src/clients/postgresClient.js'
  );
  const stateQueriesModulePath = path.resolve(
    __dirname,
    '../../src/repositories/ticketFlowStateQueries.js'
  );
  const transitionRepositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/ticketFlowTransitionRepository.js'
  );

  const originalRepositoryModule = require.cache[repositoryModulePath];
  const originalPostgresClientModule = require.cache[postgresClientModulePath];
  const originalStateQueriesModule = require.cache[stateQueriesModulePath];
  const originalTransitionRepositoryModule = require.cache[transitionRepositoryModulePath];

  delete require.cache[repositoryModulePath];
  delete require.cache[postgresClientModulePath];
  delete require.cache[stateQueriesModulePath];
  delete require.cache[transitionRepositoryModulePath];

  require.cache[postgresClientModulePath] = {
    id: postgresClientModulePath,
    filename: postgresClientModulePath,
    loaded: true,
    exports: {
      getPool: () => pool,
    },
  };
  require.cache[stateQueriesModulePath] = {
    id: stateQueriesModulePath,
    filename: stateQueriesModulePath,
    loaded: true,
    exports: stateQueries,
  };
  require.cache[transitionRepositoryModulePath] = {
    id: transitionRepositoryModulePath,
    filename: transitionRepositoryModulePath,
    loaded: true,
    exports: transitionRepository,
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

      if (originalStateQueriesModule) {
        require.cache[stateQueriesModulePath] = originalStateQueriesModule;
      } else {
        delete require.cache[stateQueriesModulePath];
      }

      if (originalTransitionRepositoryModule) {
        require.cache[transitionRepositoryModulePath] = originalTransitionRepositoryModule;
      } else {
        delete require.cache[transitionRepositoryModulePath];
      }
    },
  };
}

test('upsertInitialStates returns empty array when input is empty', async () => {
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query() {
        throw new Error('query should not be called');
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.upsertInitialStates([]);
    assert.deepStrictEqual(response, []);
  } finally {
    restore();
  }
});

test('upsertInitialStates builds query and returns rows', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query(text, values) {
        captured = { text, values };
        return { rows: [{ ticket_id: 10 }] };
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({
        text: 'UPSERT SQL',
        values: [10],
      }),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.upsertInitialStates([{ ticket_id: 10 }]);
    assert.deepStrictEqual(response, [{ ticket_id: 10 }]);
    assert.deepStrictEqual(captured, { text: 'UPSERT SQL', values: [10] });
  } finally {
    restore();
  }
});

test('getStateByTicketId returns first row and normalizes ticket id', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query(text, values) {
        captured = { text, values };
        return { rows: [{ ticket_id: 10 }] };
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.getStateByTicketId('10');
    assert.deepStrictEqual(response, { ticket_id: 10 });
    assert.match(captured.text, /WHERE tfs\.ticket_id = \$1/i);
    assert.deepStrictEqual(captured.values, [10]);
  } finally {
    restore();
  }
});

test('getStatesByTicketIds filters invalid ids and returns empty array when none remain', async () => {
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query() {
        throw new Error('query should not be called');
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.getStatesByTicketIds(['abc', undefined, Number.NaN]);
    assert.deepStrictEqual(response, []);
  } finally {
    restore();
  }
});

test('getStatesByTicketIds queries normalized id array', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query(text, values) {
        captured = { text, values };
        return { rows: [{ ticket_id: 10 }, { ticket_id: 20 }] };
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.getStatesByTicketIds(['10', 20, 'abc']);
    assert.deepStrictEqual(response, [{ ticket_id: 10 }, { ticket_id: 20 }]);
    assert.match(captured.text, /ANY\(\$1::bigint\[\]\)/i);
    assert.deepStrictEqual(captured.values, [[10, 20]]);
  } finally {
    restore();
  }
});

test('listStates delegates query builder and returns rows', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query(text, values) {
        captured = { text, values };
        return { rows: [{ ticket_id: 10 }] };
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({
        text: 'LIST SQL',
        values: ['time-a'],
      }),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.listStates({ current_owner_slug: 'time-a' });
    assert.deepStrictEqual(response, [{ ticket_id: 10 }]);
    assert.deepStrictEqual(captured, { text: 'LIST SQL', values: ['time-a'] });
  } finally {
    restore();
  }
});

test('listEventsByTicketId returns rows ordered by created date', async () => {
  let captured = null;
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async query(text, values) {
        captured = { text, values };
        return { rows: [{ id: 1 }] };
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      ensureStateExists: async () => {},
      insertEvent: async () => {},
      updateState: async () => {},
    },
  });

  try {
    const response = await repository.listEventsByTicketId('10');
    assert.deepStrictEqual(response, [{ id: 1 }]);
    assert.match(captured.text, /FROM ticket_flow_events/i);
    assert.deepStrictEqual(captured.values, [10]);
  } finally {
    restore();
  }
});

test('transitionState wraps transition in transaction and returns updated state', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return { rows: [] };
    },
    release() {
      calls.push('RELEASE');
    },
  };
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async connect() {
        return client;
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      async ensureStateExists(_client, ticketId) {
        calls.push(`ENSURE:${ticketId}`);
        return { ticket_id: 10, current_stage: 'new' };
      },
      async updateState(_client, ticketId) {
        calls.push(`UPDATE:${ticketId}`);
        return { ticket_id: 10, current_stage: 'routed' };
      },
      async insertEvent(_client, ticketId) {
        calls.push(`EVENT:${ticketId}`);
      },
    },
  });

  try {
    const response = await repository.transitionState('10', {
      next_state: { current_stage: 'routed' },
    });

    assert.deepStrictEqual(response, { ticket_id: 10, current_stage: 'routed' });
    assert.deepStrictEqual(calls, ['BEGIN', 'ENSURE:10', 'UPDATE:10', 'EVENT:10', 'COMMIT', 'RELEASE']);
  } finally {
    restore();
  }
});

test('transitionState rolls back transaction and releases client on failure', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return { rows: [] };
    },
    release() {
      calls.push('RELEASE');
    },
  };
  const { repository, restore } = loadRepositoryWithMocks({
    pool: {
      async connect() {
        return client;
      },
    },
    stateQueries: {
      buildListStatesQuery: () => ({}),
      buildUpsertInitialStatesQuery: () => ({}),
    },
    transitionRepository: {
      async ensureStateExists() {
        throw new Error('transition failed');
      },
      async updateState() {},
      async insertEvent() {},
    },
  });

  try {
    await assert.rejects(
      () => repository.transitionState('10', { next_state: {} }),
      /transition failed/i
    );
    assert.deepStrictEqual(calls, ['BEGIN', 'ROLLBACK', 'RELEASE']);
  } finally {
    restore();
  }
});
