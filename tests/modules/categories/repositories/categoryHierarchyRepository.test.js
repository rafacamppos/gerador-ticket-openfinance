const assert = require('node:assert');
const test = require('node:test');
const categoryHierarchyRepository = require('../../../../src/modules/categories/repositories/categoryHierarchyRepository');

test('categoryHierarchyRepository', async (t) => {
  await t.test('listCategoryNames returns all unique category names', async () => {
    const result = await categoryHierarchyRepository.listCategoryNames();
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result.includes('Erro na Jornada ou Dados'));
    assert.ok(result.includes('Incidentes'));
  });

  await t.test('listCategoryNames returns sorted names', async () => {
    const result = await categoryHierarchyRepository.listCategoryNames();
    const sorted = [...result].sort();
    assert.deepStrictEqual(result, sorted);
  });

  await t.test('listSubCategoryNames returns sub categories for a given category', async () => {
    const result = await categoryHierarchyRepository.listSubCategoryNames('Erro na Jornada ou Dados');
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result.includes('Obtendo um Consentimento'));
  });

  await t.test('listSubCategoryNames returns empty array for non-existent category', async () => {
    const result = await categoryHierarchyRepository.listSubCategoryNames('Non Existent Category');
    assert.deepStrictEqual(result, []);
  });

  await t.test('listThirdLevelCategoryNames returns names for a given sub category', async () => {
    const result = await categoryHierarchyRepository.listThirdLevelCategoryNames(
      'Obtendo um Consentimento'
    );
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0);
    assert.ok(result.includes('Criação de Consentimento'));
  });

  await t.test('listThirdLevelCategoryNames returns empty array for non-existent sub category', async () => {
    const result = await categoryHierarchyRepository.listThirdLevelCategoryNames(
      'Non Existent Sub Category'
    );
    assert.deepStrictEqual(result, []);
  });
});
