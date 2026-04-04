const TIPO_CLIENTE = {
  PF: 'PF',
  PJ: 'PJ',
};

const CANAL_JORNADA = {
  APP_TO_APP:         'App to app',
  APP_TO_BROWSER:     'App to browser',
  BROWSER_TO_BROWSER: 'Browser to browser',
  BROWSER_TO_APP:     'Browser to app',
  NA:                 'Não se aplica',
};

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
  CANAL_JORNADA,
  INCIDENT_STATUS,
  INCIDENT_STATUS_LABELS,
  TIPO_CLIENTE,
  getIncidentStatusLabel,
};
