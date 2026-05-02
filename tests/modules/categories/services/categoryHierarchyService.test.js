const assert = require('node:assert');
const test = require('node:test');
const categoryHierarchyService = require('../../../../src/modules/categories/services/categoryHierarchyService');

test('categoryHierarchyService', async (t) => {
  await t.test('getCategoryHierarchy returns categories when no filter is provided', async () => {
    const result = await categoryHierarchyService.getCategoryHierarchy({});
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
  });

  await t.test('getCategoryHierarchy returns sub categories when category filter is provided', async () => {
    const result = await categoryHierarchyService.getCategoryHierarchy({
      category: 'Erro na Jornada ou Dados',
    });
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result.includes('Obtendo um Consentimento'));
  });

  await t.test('getCategoryHierarchy returns third level categories when sub_category filter is provided', async () => {
    const result = await categoryHierarchyService.getCategoryHierarchy({
      subCategory: 'Obtendo um Consentimento',
    });
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result.includes('Criação de Consentimento'));
  });

  await t.test('getCategoryHierarchy prioritizes sub_category filter over category filter', async () => {
    const result = await categoryHierarchyService.getCategoryHierarchy({
      category: 'Incidentes',
      subCategory: 'Obtendo um Consentimento',
    });
    assert.ok(Array.isArray(result));
    assert.ok(result.includes('Criação de Consentimento'));
  });
});
