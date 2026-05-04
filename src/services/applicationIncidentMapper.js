const {
  INCIDENT_STATUS,
  getIncidentStatusLabel,
} = require('../contracts/applicationIncidentContract');

function normalizeIncidentRow(row = {}) {
  return {
    id: row.id ? String(row.id) : null,
    team_slug: row.team_slug || null,
    team_name: row.team_name || null,

    // request context
    title: row.title || null,
    x_fapi_interaction_id: row.x_fapi_interaction_id || null,
    authorization_server: row.authorization_server || null,
    client_id: row.client_id || null,
    endpoint: row.endpoint || null,
    method: row.method || null,
    payload_request: row.payload_request || {},
    payload_response: row.payload_response || {},
    occurred_at: row.occurred_at || null,
    http_status_code: row.http_status_code ?? null,
    description: row.description || null,
    tipo_cliente: row.tipo_cliente || null,
    canal_jornada: row.canal_jornada || null,
    id_version_api: row.id_version_api ? String(row.id_version_api) : null,
    category_data: buildCategoryData(row),

    ticket_context: buildTicketContext(row),

    // status
    incident_status: row.incident_status || INCIDENT_STATUS.NEW,
    incident_status_label: getIncidentStatusLabel(row.incident_status || INCIDENT_STATUS.NEW),
    related_ticket_id: row.related_ticket_id ? String(row.related_ticket_id) : null,

    // assignment
    assigned_to_user_id: row.assigned_to_user_id ? String(row.assigned_to_user_id) : null,
    assigned_to_name: row.assigned_to_name || null,
    assigned_to_email: row.assigned_to_email || null,

    // template data (histórico)
    data_template: row.data_template || null,

    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

function buildCategoryData(row) {
  const categoryName = row.incident_category_name ?? row.category_name;
  const subCategoryName = row.incident_sub_category_name ?? row.sub_category_name;
  const thirdLevelCategoryName =
    row.incident_third_level_category_name ?? row.third_level_category_name;

  if (!categoryName && !subCategoryName && !thirdLevelCategoryName) {
    return null;
  }

  return {
    category_name: categoryName || null,
    sub_category_name: subCategoryName || null,
    third_level_category_name: thirdLevelCategoryName || null,
  };
}

function buildTicketContext(row) {
  const context = {
    destinatario: row.destinatario || row.team_name || null,
    category_name: row.category_name || row.incident_category_name || null,
    sub_category_name: row.sub_category_name || row.incident_sub_category_name || null,
    third_level_category_name:
      row.third_level_category_name || row.incident_third_level_category_name || null,
    template_id: row.template_id ? String(row.template_id) : null,
    template_type: row.template_type ?? null,
    api_name_version: row.api_name_version || null,
    api_version: row.api_version || null,
    product_feature: row.product_feature || null,
    stage_name_version: row.stage_name_version || null,
  };

  const hasTicketContext =
    context.template_id !== null ||
    context.template_type !== null ||
    context.api_name_version !== null ||
    context.api_version !== null ||
    context.product_feature !== null ||
    context.stage_name_version !== null;

  return hasTicketContext ? context : null;
}

module.exports = {
  normalizeIncidentRow,
};
