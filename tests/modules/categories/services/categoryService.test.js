const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadServiceWithRepository(repository) {
  const serviceModulePath = path.resolve(
    __dirname,
    '../../../../src/modules/categories/services/categoryService.js'
  );
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../../../src/modules/categories/repositories/categoryRepository.js'
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

test('getAllCategories returns all categories from repository', async () => {
  const mockCategories = [
    { id: 547, category_name: 'Test 1', template_id: 123328, type: 1 },
    { id: 564, category_name: 'Test 2', template_id: 8794, type: 1 },
  ];

  const mockRepository = {
    async listAll() {
      return mockCategories;
    },
  };

  const { service, restore } = loadServiceWithRepository(mockRepository);

  try {
    const result = await service.getAllCategories();
    assert.deepStrictEqual(result, mockCategories);
  } finally {
    restore();
  }
});

test('getCategoryById returns category when found', async () => {
  const mockCategory = {
    id: 547,
    category_name: 'Test',
    sub_category_name: 'Sub',
    third_level_category_name: 'Third',
    template_id: 123328,
    type: 1,
  };

  const mockRepository = {
    async findById(id) {
      return id === 547 ? mockCategory : null;
    },
  };

  const { service, restore } = loadServiceWithRepository(mockRepository);

  try {
    const result = await service.getCategoryById(547);
    assert.deepStrictEqual(result, mockCategory);
  } finally {
    restore();
  }
});

test('getCategoryById throws 400 when id is invalid', async () => {
  const mockRepository = {
    async findById() {
      return null;
    },
  };

  const { service, restore } = loadServiceWithRepository(mockRepository);

  try {
    await assert.rejects(
      () => service.getCategoryById('abc'),
      (error) => {
        assert.strictEqual(error.status, 400);
        assert.match(error.message, /inválido/i);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('getCategoryById throws 404 when category not found', async () => {
  const mockRepository = {
    async findById() {
      return null;
    },
  };

  const { service, restore } = loadServiceWithRepository(mockRepository);

  try {
    await assert.rejects(
      () => service.getCategoryById(999),
      (error) => {
        assert.strictEqual(error.status, 404);
        assert.match(error.message, /não encontrada/i);
        return true;
      }
    );
  } finally {
    restore();
  }
});

test('getCategoryById throws 400 when id is not provided', async () => {
  const mockRepository = {
    async findById() {
      return null;
    },
  };

  const { service, restore } = loadServiceWithRepository(mockRepository);

  try {
    await assert.rejects(
      () => service.getCategoryById(undefined),
      (error) => {
        assert.strictEqual(error.status, 400);
        return true;
      }
    );
  } finally {
    restore();
  }
});
