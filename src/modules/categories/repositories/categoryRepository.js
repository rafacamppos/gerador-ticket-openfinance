const { getPool } = require('../../../clients/postgresClient');

async function listAll() {
  const result = await getPool().query(
    `
      SELECT
        id,
        category_name,
        sub_category_name,
        third_level_category_name,
        template_id,
        type
      FROM category_templates
      ORDER BY category_name, sub_category_name, third_level_category_name ASC
    `
  );

  return result.rows;
}

async function findById(id) {
  const result = await getPool().query(
    `
      SELECT
        id,
        category_name,
        sub_category_name,
        third_level_category_name,
        template_id,
        type
      FROM category_templates
      WHERE id = $1
      LIMIT 1
    `,
    [Number(id)]
  );

  return result.rows[0] || null;
}

module.exports = {
  listAll,
  findById,
};
