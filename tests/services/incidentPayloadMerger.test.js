const test = require('node:test');
const assert = require('node:assert');

const {
  mergePayload,
  extractCategoryData,
  extractTemplateData,
  normalizePayload,
  logMerge,
} = require('../../src/services/incidentPayloadMerger');

test('mergePayload combines base and template data with base priority', () => {
  const baseFields = {
    x_fapi_interaction_id: '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3',
    endpoint: '/token',
    http_method: 'POST',
  };

  const templateData = {
    endpoint: '/old-endpoint',
    custom_field: 'template-value',
  };

  const result = mergePayload(baseFields, templateData);

  assert.strictEqual(result.x_fapi_interaction_id, '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3');
  assert.strictEqual(result.endpoint, '/token');
  assert.strictEqual(result.http_method, 'POST');
  assert.strictEqual(result.custom_field, 'template-value');
});

test('mergePayload returns only base when template is null', () => {
  const baseFields = {
    x_fapi_interaction_id: 'uuid-123',
    endpoint: '/endpoint',
  };

  const result = mergePayload(baseFields, null);

  assert.strictEqual(result.x_fapi_interaction_id, 'uuid-123');
  assert.strictEqual(result.endpoint, '/endpoint');
  assert.strictEqual(Object.keys(result).length, 2);
});

test('mergePayload returns base fields when template is undefined', () => {
  const baseFields = {
    endpoint: '/test',
  };

  const result = mergePayload(baseFields, undefined);

  assert.strictEqual(result.endpoint, '/test');
});

test('mergePayload returns empty object when both are null', () => {
  const result = mergePayload({}, null);

  assert.deepStrictEqual(result, {});
});

test('extractCategoryData extracts valid category fields', () => {
  const payload = {
    category_data: {
      category_name: 'Conformidade',
      sub_category_name: 'Validação',
      third_level_category_name: 'Validação de Dados',
    },
  };

  const result = extractCategoryData(payload);

  assert.deepStrictEqual(result, {
    category_name: 'Conformidade',
    sub_category_name: 'Validação',
    third_level_category_name: 'Validação de Dados',
  });
});

test('extractCategoryData throws when category_data is missing', () => {
  const payload = {};

  assert.throws(
    () => extractCategoryData(payload),
    /Field "category_data" must be a valid object/i
  );
});

test('extractCategoryData throws when category_data is a non-object type', () => {
  assert.throws(
    () => extractCategoryData({ category_data: 'string' }),
    /Field "category_data" must be a valid object/i
  );

  assert.throws(
    () => extractCategoryData({ category_data: 123 }),
    /Field "category_data" must be a valid object/i
  );
});

test('extractCategoryData throws when required fields are missing', () => {
  const payload = {
    category_data: {
      category_name: 'Conformidade',
    },
  };

  assert.throws(
    () => extractCategoryData(payload),
    /must contain: category_name, sub_category_name, third_level_category_name/i
  );
});

test('extractTemplateData returns template when valid', () => {
  const payload = {
    template_data: {
      custom_field: 'value',
      another_field: 123,
    },
  };

  const result = extractTemplateData(payload);

  assert.deepStrictEqual(result, {
    custom_field: 'value',
    another_field: 123,
  });
});

test('extractTemplateData returns null when template_data is missing', () => {
  const payload = {};

  const result = extractTemplateData(payload);

  assert.strictEqual(result, null);
});

test('extractTemplateData returns null when template_data is null', () => {
  const payload = {
    template_data: null,
  };

  const result = extractTemplateData(payload);

  assert.strictEqual(result, null);
});

test('extractTemplateData throws when template_data is a non-object type', () => {
  assert.throws(
    () => extractTemplateData({ template_data: 'string' }),
    /Field "template_data" must be a valid object or null/i
  );

  assert.throws(
    () => extractTemplateData({ template_data: 123 }),
    /Field "template_data" must be a valid object or null/i
  );
});

test('normalizePayload separates base fields from category and template data', () => {
  const mergedPayload = {
    x_fapi_interaction_id: 'uuid-123',
    endpoint: '/test',
    category_data: {
      category_name: 'Cat',
      sub_category_name: 'SubCat',
      third_level_category_name: 'ThirdCat',
    },
    template_data: {
      custom: 'value',
    },
    other_field: 'other',
  };

  const result = normalizePayload(mergedPayload);

  assert.strictEqual(result.baseFields.x_fapi_interaction_id, 'uuid-123');
  assert.strictEqual(result.baseFields.endpoint, '/test');
  assert.strictEqual(result.baseFields.other_field, 'other');
  assert.strictEqual(result.categoryData.category_name, 'Cat');
  assert.deepStrictEqual(result.templateData, { custom: 'value' });
});

test('normalizePayload parses JSON strings for category_data', () => {
  const mergedPayload = {
    category_data: '{"category_name":"Cat","sub_category_name":"SubCat","third_level_category_name":"ThirdCat"}',
    template_data: null,
  };

  const result = normalizePayload(mergedPayload);

  assert.strictEqual(result.categoryData.category_name, 'Cat');
  assert.strictEqual(result.categoryData.sub_category_name, 'SubCat');
});

test('normalizePayload handles null template_data', () => {
  const mergedPayload = {
    category_data: {
      category_name: 'Cat',
      sub_category_name: 'SubCat',
      third_level_category_name: 'ThirdCat',
    },
    template_data: null,
  };

  const result = normalizePayload(mergedPayload);

  assert.strictEqual(result.templateData, null);
});

test('logMerge logs debug info without throwing', () => {
  assert.doesNotThrow(() => {
    logMerge(
      { field1: 'value1' },
      { field2: 'value2' },
      { field1: 'value1', field2: 'value2' }
    );
  });
});
