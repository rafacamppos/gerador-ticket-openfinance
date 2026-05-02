const { getPool } = require('../../../clients/postgresClient');

async function listCategoryNames() {
  const result = await getPool().query(
    `SELECT DISTINCT category_name
     FROM category_templates
     ORDER BY category_name ASC`
  );
  return result.rows.map((row) => row.category_name);
}

async function listSubCategoryNames(categoryName) {
  const result = await getPool().query(
    `SELECT DISTINCT sub_category_name
     FROM category_templates
     WHERE category_name = $1
     ORDER BY sub_category_name ASC`,
    [categoryName]
  );
  return result.rows.map((row) => row.sub_category_name);
}

async function listThirdLevelCategoryNames(subCategoryName) {
  const result = await getPool().query(
    `SELECT DISTINCT third_level_category_name
     FROM category_templates
     WHERE sub_category_name = $1
     ORDER BY third_level_category_name ASC`,
    [subCategoryName]
  );
  return result.rows.map((row) => row.third_level_category_name);
}

module.exports = {
  listCategoryNames,
  listSubCategoryNames,
  listThirdLevelCategoryNames,
};
