const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

// Mock logger antes de importar o controller
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === '../utils/logger') {
    return {
      info: () => {},
      debug: () => {},
      error: () => {}
    };
  }
  return originalRequire.apply(this, arguments);
};

const apiVersionsController = require('../../src/controllers/apiVersionsController');
const incidentTicketRepository = require('../../src/repositories/incidentTicketRepository');

// Mock do repositório
const originalListApiVersions = incidentTicketRepository.listApiVersions;

// Helper para criar mock de response
function createMockResponse() {
  return {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
}

test('apiVersionsController.listApiVersions', async (t) => {
  const mockApiVersions = [
    {
      id: 1,
      api_name_version: 'Dados Abertos - Fase 1',
      api_version: '1.0.0-beta.1',
      product_feature: 'Adiantamento a Depositantes',
      stage_name_version: 'Dados Abertos - Fase 1 - Adiantamento a Depositantes'
    },
    {
      id: 2,
      api_name_version: 'Dados Abertos - Fase 1',
      api_version: '1.0.0',
      product_feature: 'Adiantamento a Depositantes',
      stage_name_version: 'Dados Abertos - Fase 1 - Adiantamento a Depositantes'
    },
    {
      id: 3,
      api_name_version: 'Dados Abertos - Fase 4A',
      api_version: '1.0.0',
      product_feature: 'Câmbio',
      stage_name_version: 'Dados Abertos - Fase 4A - Câmbio'
    }
  ];

  await t.test('should return all API versions', async () => {
    incidentTicketRepository.listApiVersions = async () => mockApiVersions;

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123'
    };

    await apiVersionsController.listApiVersions(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.jsonData);
    assert.ok(res.jsonData.data);
    assert.strictEqual(res.jsonData.data.total_versions, 3);
    assert.strictEqual(res.jsonData.data.versions.length, 3);
    assert.strictEqual(res.jsonData.data.versions[0].id, 1);
    assert.strictEqual(res.jsonData.data.versions[0].api_name_version, 'Dados Abertos - Fase 1');
    assert.strictEqual(res.jsonData.data.versions[0].api_version, '1.0.0-beta.1');
  });

  await t.test('should return empty array when no versions found', async () => {
    incidentTicketRepository.listApiVersions = async () => [];

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123'
    };

    await apiVersionsController.listApiVersions(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.total_versions, 0);
    assert.strictEqual(res.jsonData.data.versions.length, 0);
  });

  await t.test('should return null when repository returns null', async () => {
    incidentTicketRepository.listApiVersions = async () => null;

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123'
    };

    await apiVersionsController.listApiVersions(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.total_versions, 0);
    assert.strictEqual(res.jsonData.data.versions.length, 0);
  });

  await t.test('should handle errors properly', async () => {
    const testError = new Error('Database connection failed');
    incidentTicketRepository.listApiVersions = async () => {
      throw testError;
    };

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123'
    };

    let nextError = null;
    const next = (error) => {
      nextError = error;
    };

    await apiVersionsController.listApiVersions(req, res, next);

    assert.ok(nextError);
    assert.strictEqual(nextError.message, 'Database connection failed');
  });

  // Restore original function
  incidentTicketRepository.listApiVersions = originalListApiVersions;
});

const originalGetApiVersionById = incidentTicketRepository.getApiVersionById;

test('apiVersionsController.getApiVersionById', async (t) => {
  const mockApiVersion = {
    id: 1,
    api_name_version: 'Dados Abertos - Fase 1',
    api_version: '1.0.0-beta.1',
    product_feature: 'Adiantamento a Depositantes',
    stage_name_version: 'Dados Abertos - Fase 1 - Adiantamento a Depositantes'
  };

  await t.test('should return API version by id', async () => {
    incidentTicketRepository.getApiVersionById = async () => mockApiVersion;

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123',
      params: { id: '1' }
    };

    await apiVersionsController.getApiVersionById(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.jsonData);
    assert.ok(res.jsonData.data);
    assert.strictEqual(res.jsonData.data.id, 1);
    assert.strictEqual(res.jsonData.data.api_name_version, 'Dados Abertos - Fase 1');
    assert.strictEqual(res.jsonData.data.api_version, '1.0.0-beta.1');
  });

  await t.test('should return 404 when version not found', async () => {
    incidentTicketRepository.getApiVersionById = async () => null;

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123',
      params: { id: '999' }
    };

    await apiVersionsController.getApiVersionById(req, res, () => {});

    assert.strictEqual(res.statusCode, 404);
    assert.ok(res.jsonData.message);
    assert.strictEqual(res.jsonData.message, 'API version not found.');
  });

  await t.test('should return 400 when id is not provided', async () => {
    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123',
      params: {}
    };

    await apiVersionsController.getApiVersionById(req, res, () => {});

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.message, 'Field "id" is required.');
  });

  await t.test('should handle errors properly', async () => {
    const testError = new Error('Database connection failed');
    incidentTicketRepository.getApiVersionById = async () => {
      throw testError;
    };

    const res = createMockResponse();
    const req = {
      requestId: 'test-request-123',
      params: { id: '1' }
    };

    let nextError = null;
    const next = (error) => {
      nextError = error;
    };

    await apiVersionsController.getApiVersionById(req, res, next);

    assert.ok(nextError);
    assert.strictEqual(nextError.message, 'Database connection failed');
  });

  // Restore original function
  incidentTicketRepository.getApiVersionById = originalGetApiVersionById;
});
