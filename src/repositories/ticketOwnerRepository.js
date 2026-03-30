const { getPool } = require('../clients/postgresClient');

async function listActiveOwners() {
  const result = await getPool().query(
    `
      SELECT
        id,
        slug,
        name,
        description,
        is_triage_team,
        is_fallback_owner
      FROM ticket_owners
      WHERE is_active = TRUE
      ORDER BY is_fallback_owner DESC, is_triage_team DESC, name ASC
    `
  );

  return result.rows;
}

async function getActiveOwnerBySlug(slug) {
  const result = await getPool().query(
    `
      SELECT
        id,
        slug,
        name,
        description,
        is_triage_team,
        is_fallback_owner
      FROM ticket_owners
      WHERE slug = $1
        AND is_active = TRUE
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] || null;
}

async function listActiveRules() {
  const result = await getPool().query(
    `
      SELECT
        id,
        ticket_owner_id,
        rule_group_code,
        logical_operator,
        field_code,
        operator,
        expected_value,
        priority_order
      FROM ticket_owner_rules
      WHERE is_active = TRUE
      ORDER BY priority_order ASC, id ASC
    `
  );

  return result.rows;
}

module.exports = {
  getActiveOwnerBySlug,
  listActiveOwners,
  listActiveRules,
};
