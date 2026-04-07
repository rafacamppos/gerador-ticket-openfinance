const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadServiceWithRepository(repository) {
  const serviceModulePath = path.resolve(
    __dirname,
    '../../src/services/portalAuthService.js'
  );
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/ticketUserRepository.js'
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

test('loginPortalUser requires email and password', async () => {
  const { service, restore } = loadServiceWithRepository({
    async findActiveUserByEmail() {
      throw new Error('repository should not be called');
    },
  });

  try {
    await assert.rejects(
      () => service.loginPortalUser({ email: '', password: '' }),
      /Fields "email" and "password" are required/i
    );
  } finally {
    restore();
  }
});

test('loginPortalUser normalizes email and returns public user contract', async () => {
  let captured = null;
  const { service, restore } = loadServiceWithRepository({
    async findActiveUserByEmail(email) {
      captured = email;
      return {
        id: 8,
        name: 'Rafael',
        email: 'rafael@example.com',
        profile: 'admin',
        ticket_owner_id: 3,
        owner_slug: 'time-a',
        owner_name: 'Time A',
        password: 'secret',
      };
    },
  });

  try {
    const response = await service.loginPortalUser({
      email: ' Rafael@Example.com ',
      password: 'secret',
    });

    assert.strictEqual(captured, 'rafael@example.com');
    assert.deepStrictEqual(response, {
      id: '8',
      name: 'Rafael',
      email: 'rafael@example.com',
      profile: 'admin',
      team: {
        id: '3',
        slug: 'time-a',
        name: 'Time A',
      },
    });
  } finally {
    restore();
  }
});

test('loginPortalUser rejects invalid credentials', async () => {
  const { service, restore } = loadServiceWithRepository({
    async findActiveUserByEmail() {
      return {
        password: 'different',
      };
    },
  });

  try {
    await assert.rejects(
      () => service.loginPortalUser({ email: 'rafael@example.com', password: 'secret' }),
      /Credenciais inválidas/i
    );
  } finally {
    restore();
  }
});

test('getPortalSessionUser returns portal user from session or null', () => {
  const service = require('../../src/services/portalAuthService');

  assert.deepStrictEqual(service.getPortalSessionUser({ portalUser: { id: '8' } }), { id: '8' });
  assert.strictEqual(service.getPortalSessionUser({}), null);
});

test('loginPortalUser returns null-safe normalized user when user has missing fields', async () => {
  const service = require('../../src/services/portalAuthService');
  const repo = require('../../src/repositories/ticketUserRepository');
  const originalFind = repo.findActiveUserByEmail;

  repo.findActiveUserByEmail = async () => ({
    id: null,
    name: null,
    email: 'test@example.com',
    password: 'pass123',
    profile: null,
    ticket_owner_id: null,
    owner_slug: null,
    owner_name: null,
  });

  try {
    const result = await service.loginPortalUser({ email: 'test@example.com', password: 'pass123' });
    assert.strictEqual(result.id, null);
    assert.strictEqual(result.team.id, null);
    assert.strictEqual(result.team.slug, null);
  } finally {
    repo.findActiveUserByEmail = originalFind;
  }
});
