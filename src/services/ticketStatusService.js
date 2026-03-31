function getTicketStatusRepository() {
  return require('../repositories/ticketStatusRepository');
}

async function listTicketStatuses() {
  const repository = getTicketStatusRepository();
  const rows = await repository.listTicketStatuses();

  return rows.map((row) => ({
    id: row.id ? String(row.id) : null,
    name: row.nome || null,
  }));
}

module.exports = {
  listTicketStatuses,
};
