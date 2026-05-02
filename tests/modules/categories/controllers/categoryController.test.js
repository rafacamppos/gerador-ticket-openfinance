const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { createMockResponse } = require('../../helpers/testHelpers');

function loadControllerWithService(service) {
  const controllerModulePath = path.resolve(
    __dirname,
    '../../../../src/modules/categories/controllers/categoryController.js'
  );
  const serviceModulePath = path.resolve(
    __dirname,
    '../../../../src/modules/categories/services/categoryService.js'
  );
  const loggerModulePath = path.resolve(
    __dirname,
    '../../../../src/utils/logger.js'
  );

  const originalControllerModule = require.cache[controllerModulePath];
  const originalServiceModule = require.cache[serviceModulePath];
  const originalLoggerModule = require.cache[loggerModulePath];

  delete require.cache[controllerModulePath];
  delete require.cache[serviceModulePath];
  delete require.cache[loggerModulePath];

  const mockLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  require.cache[serviceModulePath] = {
    id: serviceModulePath,
    filename: serviceModulePath,
    loaded: true,
    exports: service,
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

      if (originalServiceModule) {
        require.cache[serviceModulePath] = originalServiceModule;
      } else {
        delete require.cache[serviceModulePath];
      }

      if (originalLoggerModule) {
        require.cache[loggerModulePath] = originalLoggerModule;
      } else {
        delete require.cache[loggerModulePath];
      }
    },
  };
}

test('list returns all categories with count', async () => {
  const mockCategories = [
    {
      id: 547,
      category_name: 'Test 1',
      sub_category_name: 'Sub 1',
      third_level_category_name: 'Third 1',
      template_id: 123328,
      type: 1,
    },
  ];

  const mockService = {
    async getAllCategories() {
      return mockCategories;
    },
  };

  const { controller, restore } = loadControllerWithService(mockService);

  try {
    const req = { requestId: 'test-123' };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.list(req, res, next);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, mockCategories);
    assert.strictEqual(res.body.count, 1);
  } finally {
    restore();
  }
});

test('list returns empty array when no categories', async () => {
  const mockService = {
    async getAllCategories() {
      return [];
    },
  };

  const { controller, restore } = loadControllerWithService(mockService);

  try {
    const req = { requestId: 'test-124' };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.list(req, res, next);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, []);
    assert.strictEqual(res.body.count, 0);
  } finally {
    restore();
  }
});

test('getById returns category when found', async () => {
  const mockCategory = {
    id: 547,
    category_name: 'Test',
    sub_category_name: 'Sub',
    third_level_category_name: 'Third',
    template_id: 123328,
    type: 1,
  };

  const mockService = {
    async getCategoryById(id) {
      if (id === '547') return mockCategory;
      throw new Error('Not found');
    },
  };

  const { controller, restore } = loadControllerWithService(mockService);

  try {
    const req = { requestId: 'test-125', params: { categoryId: '547' } };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getById(req, res, next);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.data, mockCategory);
  } finally {
    restore();
  }
});

test('getById returns 400 when service throws 400', async () => {
  const mockService = {
    async getCategoryById() {
      const error = new Error('ID da categoria inválido.');
      error.status = 400;
      error.details = { categoryId: 'abc' };
      throw error;
    },
  };

  const { controller, restore } = loadControllerWithService(mockService);

  try {
    const req = { requestId: 'test-126', params: { categoryId: 'abc' } };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getById(req, res, next);

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /inválido/i);
  } finally {
    restore();
  }
});

test('getById returns 404 when service throws 404', async () => {
  const mockService = {
    async getCategoryById() {
      const error = new Error('Categoria não encontrada.');
      error.status = 404;
      error.details = { categoryId: 999 };
      throw error;
    },
  };

  const { controller, restore } = loadControllerWithService(mockService);

  try {
    const req = { requestId: 'test-127', params: { categoryId: '999' } };
    const res = createMockResponse();
    const next = (error) => {
      throw error;
    };

    await controller.getById(req, res, next);

    assert.strictEqual(res.statusCode, 404);
    assert.match(res.body.message, /não encontrada/i);
  } finally {
    restore();
  }
});

test('getById passes non-validation errors to next handler', async () => {
  const testError = new Error('Database error');
  const mockService = {
    async getCategoryById() {
      throw testError;
    },
  };

  const { controller, restore } = loadControllerWithService(mockService);

  try {
    const req = { requestId: 'test-128', params: { categoryId: '547' } };
    const res = createMockResponse();
    let nextError = null;
    const next = (error) => {
      nextError = error;
    };

    await controller.getById(req, res, next);

    assert.strictEqual(nextError, testError);
  } finally {
    restore();
  }
});
