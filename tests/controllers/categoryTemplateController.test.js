const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { createMockResponse } = require('../helpers/testHelpers');

function loadControllerWithRepository(repository) {
  const controllerModulePath = path.resolve(
    __dirname,
    '../../src/controllers/categoryTemplateController.js'
  );
  const repositoryModulePath = path.resolve(
    __dirname,
    '../../src/repositories/categoryTemplateRepository.js'
  );
  const loggerModulePath = path.resolve(
    __dirname,
    '../../src/utils/logger.js'
  );

  const originalControllerModule = require.cache[controllerModulePath];
  const originalRepositoryModule = require.cache[repositoryModulePath];
  const originalLoggerModule = require.cache[loggerModulePath];

  delete require.cache[controllerModulePath];
  delete require.cache[repositoryModulePath];
  delete require.cache[loggerModulePath];

  const mockLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
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
    exports: mockLogger,
  };

  const controller = require(controllerModulePath);

  return {
    controller,
    restore() {
      if (originalControllerModule) {
        require.cache[controllerModulePath] = originalControllerModule;
      } else {
        delete require.cache[controllerModulePath];
      }

      if (originalRepositoryModule) {
        require.cache[repositoryModulePath] = originalRepositoryModule;
      } else {
        delete require.cache[repositoryModulePath];
      }

      if (originalLoggerModule) {
        require.cache[loggerModulePath] = originalLoggerModule;
      } else {
        delete require.cache[loggerModulePath];
      }
    },
  };
}

test('listCategories returns all categories with count', async () => {
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

  const mockRepository = {
    async listAllCategories() {
      return mockCategories;
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = { requestId: 'test-req-123' };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.listCategories(req, res, next);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, mockCategories);
    assert.strictEqual(res.body.count, 2);
  } finally {
    restore();
  }
});

test('listCategories returns empty array when no categories exist', async () => {
  const mockRepository = {
    async listAllCategories() {
      return [];
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = { requestId: 'test-req-456' };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.listCategories(req, res, next);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, []);
    assert.strictEqual(res.body.count, 0);
  } finally {
    restore();
  }
});

test('getCategoryById returns category by id', async () => {
  const mockCategory = {
    id: 547,
    category_name: 'Erro na Jornada ou Dados',
    sub_category_name: 'Obtendo um Consentimento',
    third_level_category_name: 'Criação de Consentimento',
    template_id: 123328,
    type: 1,
  };

  const mockRepository = {
    async getCategoryById(id) {
      return id === '547' ? mockCategory : null;
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = {
      requestId: 'test-req-789',
      params: { categoryId: '547' },
    };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getCategoryById(req, res, next);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, mockCategory);
  } finally {
    restore();
  }
});

test('getCategoryById returns 400 when categoryId is not provided', async () => {
  const mockRepository = {
    async getCategoryById() {
      return null;
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = {
      requestId: 'test-req-900',
      params: { categoryId: undefined },
    };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getCategoryById(req, res, next);

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /inválido/i);
  } finally {
    restore();
  }
});

test('getCategoryById returns 400 when categoryId is not a number', async () => {
  const mockRepository = {
    async getCategoryById() {
      return null;
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = {
      requestId: 'test-req-901',
      params: { categoryId: 'abc' },
    };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getCategoryById(req, res, next);

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /inválido/i);
  } finally {
    restore();
  }
});

test('getCategoryById returns 404 when category not found', async () => {
  const mockRepository = {
    async getCategoryById() {
      return null;
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = {
      requestId: 'test-req-902',
      params: { categoryId: '999' },
    };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getCategoryById(req, res, next);

    assert.strictEqual(res.statusCode, 404);
    assert.match(res.body.message, /não encontrada/i);
  } finally {
    restore();
  }
});

test('getCategoryById passes errors to next handler', async () => {
  const testError = new Error('Database connection failed');
  const mockRepository = {
    async getCategoryById() {
      throw testError;
    },
  };

  const { controller, restore } = loadControllerWithRepository(mockRepository);

  try {
    const req = {
      requestId: 'test-req-903',
      params: { categoryId: '547' },
    };
    const res = createMockResponse();
    let nextError = null;
    const next = (error) => {
      nextError = error;
    };

    await controller.getCategoryById(req, res, next);

    assert.strictEqual(nextError, testError);
  } finally {
    restore();
  }
});
