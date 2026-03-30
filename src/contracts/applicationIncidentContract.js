const INCIDENT_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  TICKET_CREATED: 'ticket_created',
  MONITORING: 'monitoring',
  RESOLVED: 'resolved',
  CANCELED: 'canceled',
};

const INCIDENT_STATUS_LABELS = {
  [INCIDENT_STATUS.NEW]: 'Novo',
  [INCIDENT_STATUS.ASSIGNED]: 'Atribuido',
  [INCIDENT_STATUS.TICKET_CREATED]: 'Ticket criado',
  [INCIDENT_STATUS.MONITORING]: 'Em análise',
  [INCIDENT_STATUS.RESOLVED]: 'Resolvido',
  [INCIDENT_STATUS.CANCELED]: 'Cancelado',
};

function getIncidentStatusLabel(status) {
  return INCIDENT_STATUS_LABELS[status] || status || 'Nao informado';
}

module.exports = {
  INCIDENT_STATUS,
  INCIDENT_STATUS_LABELS,
  getIncidentStatusLabel,
};
