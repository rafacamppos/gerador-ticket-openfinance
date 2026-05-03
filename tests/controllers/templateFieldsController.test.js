const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

// Mock logger antes de importar o controller
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === '../utils/logger') {
    return {
      info: () => {},
      warn: () => {},
      error: () => {}
    };
  }
  return originalRequire.apply(this, arguments);
};

const templateFieldsController = require('../../src/controllers/templateFieldsController');
const incidentTicketRepository = require('../../src/repositories/incidentTicketRepository');

// Mock do repositório
const originalGetTemplateFields = incidentTicketRepository.getTemplateFields;

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

test('templateFieldsController.getTemplateFields', async (t) => {
  // Dados mock para teste
  const mockTemplateFields = [
    {
      field_name: 'Título',
      field_label_api: 'title',
      field_type: 'text',
      is_required: true,
      context_key: 'titulo',
      list_options: null
    },
    {
      field_name: 'Descrição',
      field_label_api: 'description',
      field_type: 'text',
      is_required: true,
      context_key: 'descricao',
      list_options: null
    },
    {
      field_name: 'Canal da Jornada',
      field_label_api: 'CustomColumn174sr',
      field_type: 'list',
      is_required: true,
      context_key: 'canal_jornada',
      list_options: { 'App to app': '1', 'App to browser': '2' }
    }
  ];

  await t.test('should return template fields successfully', async () => {
    incidentTicketRepository.getTemplateFields = async (templateId) => {
      return mockTemplateFields;
    };

    const res = createMockResponse();
    const req = {
      params: { templateId: '123330' },
      requestId: 'test-request-123'
    };

    await templateFieldsController.getTemplateFields(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.jsonData);
    assert.ok(res.jsonData.data);
    assert.strictEqual(res.jsonData.data.template_id, 123330);
    assert.strictEqual(res.jsonData.data.fields_count, 1);
    assert.strictEqual(res.jsonData.data.fields.length, 1);

    const field = res.jsonData.data.fields[0];
    assert.strictEqual(field.context_key, 'canal_jornada');
    assert.ok(field.field_name);
    assert.strictEqual(field.field_type, 'list');
    assert.strictEqual(field.is_required, true);
    assert.ok(field.list_options);
    assert.ok(!field.value); // value não deve existir
  });

  await t.test('should reject invalid template ID', async () => {
    const res = createMockResponse();
    const req = {
      params: { templateId: 'invalid' },
      requestId: 'test-request-123'
    };

    await templateFieldsController.getTemplateFields(req, res, () => {});

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.code, 'INVALID_TEMPLATE_ID');
  });

  await t.test('should reject missing template ID', async () => {
    const res = createMockResponse();
    const req = {
      params: { templateId: null },
      requestId: 'test-request-123'
    };

    await templateFieldsController.getTemplateFields(req, res, () => {});

    assert.strictEqual(res.statusCode, 400);
  });

  await t.test('should return 404 when template not found', async () => {
    incidentTicketRepository.getTemplateFields = async () => [];

    const res = createMockResponse();
    const req = {
      params: { templateId: '99999' },
      requestId: 'test-request-123'
    };

    await templateFieldsController.getTemplateFields(req, res, () => {});

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.jsonData.code, 'TEMPLATE_NOT_FOUND');
  });

  await t.test('should format fields template correctly', async () => {
    const fieldsWithOptions = [
      {
        field_name: 'Canal da Jornada',
        field_label_api: 'CustomColumn174sr',
        field_type: 'list',
        is_required: true,
        context_key: 'canal_jornada',
        list_options: {
          'App to app': '1',
          'App to browser': '2'
        }
      }
    ];

    incidentTicketRepository.getTemplateFields = async () => fieldsWithOptions;

    const res = createMockResponse();
    const req = {
      params: { templateId: '123330' },
      requestId: 'test-request-123'
    };

    await templateFieldsController.getTemplateFields(req, res, () => {});

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.jsonData.data.fields);
    assert.strictEqual(res.jsonData.data.fields.length, 1);

    const field = res.jsonData.data.fields[0];
    assert.strictEqual(field.context_key, 'canal_jornada');
    assert.ok(field.field_name);
    assert.strictEqual(field.field_type, 'list');
    assert.strictEqual(field.is_required, true);
    assert.ok(field.list_options);
    assert.strictEqual(field.list_options['App to app'], '1');
    assert.ok(!field.value); // value não deve existir
  });

  await t.test('should handle errors properly', async () => {
    const testError = new Error('Database connection failed');
    incidentTicketRepository.getTemplateFields = async () => {
      throw testError;
    };

    const res = createMockResponse();
    const req = {
      params: { templateId: '123330' },
      requestId: 'test-request-123'
    };

    let nextError = null;
    const next = (error) => {
      nextError = error;
    };

    await templateFieldsController.getTemplateFields(req, res, next);

    assert.ok(nextError);
    assert.strictEqual(nextError.message, 'Database connection failed');
  });

  // Restore original function
  incidentTicketRepository.getTemplateFields = originalGetTemplateFields;
});
