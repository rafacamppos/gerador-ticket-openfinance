const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadRepositoryWithPool(pool) {
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/categoryTemplateRepository.js'
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

test('listAllCategories queries all categories ordered by name', async () => {
  let captured = null;
  const mockCategories = [
    {
      id: 547,
      category_name: 'Erro na Jornada ou Dados',
      sub_category_name: 'Obtendo um Consentimento',
      third_level_category_name: 'Criação de Consentimento',
      template_id: 123328,
      type: 1,
    },
    {
      id: 564,
      category_name: 'Conformidade',
      sub_category_name: 'Correções Necessárias em APIs',
      third_level_category_name: 'Correções Necessárias em APIs',
      template_id: 8794,
      type: 1,
    },
  ];

  const pool = {
    async query(text, values) {
      captured = { text, values };
      return { rows: mockCategories };
    },
  };

  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const result = await repository.listAllCategories();

    assert.deepStrictEqual(result, mockCategories);
    assert.match(captured.text, /FROM category_templates/i);
    assert.match(captured.text, /ORDER BY/i);
    assert.strictEqual(captured.values, undefined);
  } finally {
    restore();
  }
});

test('listAllCategories returns empty array when no categories exist', async () => {
  const pool = {
    async query() {
      return { rows: [] };
    },
  };

  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const result = await repository.listAllCategories();

    assert.deepStrictEqual(result, []);
  } finally {
    restore();
  }
});

test('getCategoryById queries by id and returns single category', async () => {
  let captured = null;
  const mockCategory = {
    id: 547,
    category_name: 'Erro na Jornada ou Dados',
    sub_category_name: 'Obtendo um Consentimento',
    third_level_category_name: 'Criação de Consentimento',
    template_id: 123328,
    type: 1,
  };

  const pool = {
    async query(text, values) {
      captured = { text, values };
      return { rows: [mockCategory] };
    },
  };

  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const result = await repository.getCategoryById(547);

    assert.deepStrictEqual(result, mockCategory);
    assert.match(captured.text, /WHERE id = \$1/i);
    assert.deepStrictEqual(captured.values, [547]);
  } finally {
    restore();
  }
});

test('getCategoryById normalizes id to number', async () => {
  let captured = null;
  const mockCategory = {
    id: 547,
    category_name: 'Test',
    sub_category_name: 'Test',
    third_level_category_name: 'Test',
    template_id: 123328,
    type: 1,
  };

  const pool = {
    async query(text, values) {
      captured = { text, values };
      return { rows: [mockCategory] };
    },
  };

  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const result = await repository.getCategoryById('547');

    assert.deepStrictEqual(result, mockCategory);
    assert.strictEqual(captured.values[0], 547);
  } finally {
    restore();
  }
});

test('getCategoryById returns null when category not found', async () => {
  const pool = {
    async query() {
      return { rows: [] };
    },
  };

  const { repository, restore } = loadRepositoryWithPool(pool);

  try {
    const result = await repository.getCategoryById(999);

    assert.strictEqual(result, null);
  } finally {
    restore();
  }
});
