const TIPO_CLIENTE = {
  PF: 'PF',
  PJ: 'PJ',
};

const CANAL_JORNADA = {
  APP_TO_APP: 'App to app',
  APP_TO_BROWSER: 'App to browser',
  BROWSER_TO_BROWSER: 'Browser to browser',
  BROWSER_TO_APP: 'Browser to app',
  NA: 'Não se aplica',
};

const CATEGORY_DATA_FIELDS = {
  CATEGORY_NAME: 'category_name',
  SUB_CATEGORY_NAME: 'sub_category_name',
  THIRD_LEVEL_CATEGORY_NAME: 'third_level_category_name',
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

// Payload base obrigatório - todos esses campos são necessários
const INCIDENT_PAYLOAD_BASE_FIELDS = {
  X_FAPI_INTERACTION_ID: 'x_fapi_interaction_id',
  AUTHORIZATION_SERVER: 'authorization_server',
  CLIENT_ID: 'client_id',
  ENDPOINT: 'endpoint',
  CATEGORY_DATA: 'category_data',
  ID_VERSION_API: 'id_version_api',
  HTTP_METHOD: 'http_method',
  PAYLOAD_REQUEST: 'payload_request',
  PAYLOAD_RESPONSE: 'payload_response',
  OCCURRED_AT: 'occurred_at',
  DESCRIPTION: 'description',
  TITLE: 'title',
  CANAL_JORNADA: 'canal_jornada',
  TIPO_CLIENTE: 'tipo_cliente',
  HTTP_STATUS_CODE: 'http_status_code',
};

const INCIDENT_PAYLOAD_BASE_REQUIRED = [
  'x_fapi_interaction_id',
  'authorization_server',
  'client_id',
  'endpoint',
  'category_data',
  'id_version_api',
  'http_method',
  'payload_request',
  'payload_response',
  'occurred_at',
  'description',
  'title',
  'canal_jornada',
  'tipo_cliente',
  'http_status_code',
];

// Template data é opcional - pode conter campos específicos do template
const INCIDENT_TEMPLATE_DATA_FIELDS = {
  TEMPLATE_DATA: 'template_data',
};

function getIncidentStatusLabel(status) {
  return INCIDENT_STATUS_LABELS[status] || status || 'Nao informado';
}

module.exports = {
  CANAL_JORNADA,
  CATEGORY_DATA_FIELDS,
  INCIDENT_STATUS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_PAYLOAD_BASE_FIELDS,
  INCIDENT_PAYLOAD_BASE_REQUIRED,
  INCIDENT_TEMPLATE_DATA_FIELDS,
  TIPO_CLIENTE,
  getIncidentStatusLabel,
};
