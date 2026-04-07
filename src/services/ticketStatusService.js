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

async function getTicketStatusByName(statusName) {
  const normalizedStatusName = String(statusName || '').trim().toUpperCase();

  if (!normalizedStatusName) {
    return null;
  }

  const statuses = await listTicketStatuses();

  return (
    statuses.find(
      (status) => String(status.name || '').trim().toUpperCase() === normalizedStatusName
    ) || null
  );
}

module.exports = {
  getTicketStatusByName,
  listTicketStatuses,
};
