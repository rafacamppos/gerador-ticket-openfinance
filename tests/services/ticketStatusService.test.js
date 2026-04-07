const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadServiceWithRepository(repository) {
  const serviceModulePath = path.resolve(
    __dirname,
    '../../src/services/ticketStatusService.js'
  );
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/ticketStatusRepository.js'
  );

  const originalServiceModule = require.cache[serviceModulePath];
  const originalRepositoryModule = require.cache[repositoryModulePath];

  delete require.cache[serviceModulePath];
  delete require.cache[repositoryModulePath];

  require.cache[repositoryModulePath] = {
    id: repositoryModulePath,
    filename: repositoryModulePath,
    loaded: true,
    exports: repository,
  };

  const service = require(serviceModulePath);

  return {
    service,
    restore() {
      if (originalServiceModule) {
        require.cache[serviceModulePath] = originalServiceModule;
      } else {
        delete require.cache[serviceModulePath];
      }

      if (originalRepositoryModule) {
        require.cache[repositoryModulePath] = originalRepositoryModule;
      } else {
        delete require.cache[repositoryModulePath];
      }
    },
  };
}

test('listTicketStatuses normalizes repository rows', async () => {
  const { service, restore } = loadServiceWithRepository({
    async listTicketStatuses() {
      return [
        { id: 10, nome: 'NOVO' },
        { id: null, nome: null },
      ];
    },
  });

  try {
    const response = await service.listTicketStatuses();

    assert.deepStrictEqual(response, [
      { id: '10', name: 'NOVO' },
      { id: null, name: null },
    ]);
  } finally {
    restore();
  }
});

test('getTicketStatusByName returns normalized status by name', async () => {
  const { service, restore } = loadServiceWithRepository({
    async listTicketStatuses() {
      return [
        { id: 1, nome: 'NOVO' },
        { id: 2, nome: 'EM ANÁLISE N1' },
      ];
    },
  });

  try {
    const response = await service.getTicketStatusByName('novo');

    assert.deepStrictEqual(response, { id: '1', name: 'NOVO' });
  } finally {
    restore();
  }
});

test('getTicketStatusByName returns null when status does not exist', async () => {
  const { service, restore } = loadServiceWithRepository({
    async listTicketStatuses() {
      return [{ id: 2, nome: 'EM ANÁLISE N1' }];
    },
  });

  try {
    const response = await service.getTicketStatusByName('novo');

    assert.strictEqual(response, null);
  } finally {
    restore();
  }
});
