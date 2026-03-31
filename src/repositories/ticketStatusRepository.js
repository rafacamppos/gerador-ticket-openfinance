const { getPool } = require('../clients/postgresClient');

async function listTicketStatuses() {
  const result = await getPool().query(
    `
      SELECT
        id,
        nome
      FROM estado_ticket
      ORDER BY id ASC
    `
  );

  return result.rows;
}

module.exports = {
  listTicketStatuses,
};
