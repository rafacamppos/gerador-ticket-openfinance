const { getPool } = require('../clients/postgresClient');

async function findActiveUserByEmail(email) {
  const result = await getPool().query(
    `
      SELECT
        user_record.id,
        user_record.name,
        user_record.email,
        user_record.password,
        user_record.profile,
        user_record.ticket_owner_id,
        owner.slug AS owner_slug,
        owner.name AS owner_name
      FROM ticket_users user_record
      JOIN ticket_owners owner
        ON owner.id = user_record.ticket_owner_id
      WHERE user_record.email = $1
        AND user_record.is_active = TRUE
      LIMIT 1
    `,
    [String(email || '').trim().toLowerCase()]
  );

  return result.rows[0] || null;
}

module.exports = {
  findActiveUserByEmail,
};
