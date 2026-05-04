const { buildError } = require('./openFinanceServiceErrors');
const { INCIDENT_STATUS } = require('../contracts/applicationIncidentContract');
const ticketOwnerRepository = require('../repositories/ticketOwnerRepository');
const applicationIncidentRepository = require('../repositories/applicationIncidentRepository');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');
const { normalizeIncidentRow } = require('./applicationIncidentMapper');
const {
  normalizeRelatedTicketId,
  normalizeTeamSlug,
  validateAndNormalizePayloadBase,
} = require('./applicationIncidentValidation');
const { mergePayload } = require('./incidentPayloadMerger');

/**
 * Mapeamento de equivalências entre payload_base (inglês) e template_data (português)
 */
const BASE_TEMPLATE_FIELD_EQUIVALENCES = {
  title: ['titulo', 'title'],
  description: ['descricao', 'description'],
};

/**
 * Filtra template_data para manter apenas campos que NÃO estão no payload_base
 * Considera equivalências de nomes (ex: title = titulo, description = descricao)
 */
function filterTemplateDataFields(templateData, payloadBase) {
  if (!templateData || typeof templateData !== 'object') {
    return null;
  }

  const baseKeys = Object.keys(payloadBase || {});

  // Criar conjunto de todos os nomes equivalentes do payload_base
  const excludedKeys = new Set();
  baseKeys.forEach(key => {
    excludedKeys.add(key);
    // Adicionar também os equivalentes
    Object.entries(BASE_TEMPLATE_FIELD_EQUIVALENCES).forEach(([baseKey, equivalents]) => {
      if (baseKey === key || equivalents.includes(key)) {
        equivalents.forEach(eq => excludedKeys.add(eq));
      }
    });
  });

  const filtered = {};
  Object.entries(templateData).forEach(([key, value]) => {
    if (!excludedKeys.has(key)) {
      filtered[key] = value;
    }
  });

  return Object.keys(filtered).length > 0 ? filtered : null;
}

async function reportApplicationIncident(teamSlug, payload = {}) {
  const owner = await ticketOwnerRepository.getActiveOwnerBySlug(normalizeTeamSlug(teamSlug));

  if (!owner) {
    throw buildError('Equipe não encontrada.', 404);
  }

  const { template_data: templateData, ...baseFields } = payload;
  const mergedPayload = mergePayload(baseFields, templateData);
  const validatedPayload = validateAndNormalizePayloadBase(mergedPayload);

  // Filtrar template_data para manter apenas campos que NÃO estão no baseFields
  const filteredTemplateData = filterTemplateDataFields(templateData, baseFields);

  const normalizedPayload = {
    ticket_owner_id: owner.id,
    team_slug: owner.slug,
    team_name: owner.name,
    x_fapi_interaction_id: validatedPayload.x_fapi_interaction_id,
    authorization_server: validatedPayload.authorization_server,
    client_id: validatedPayload.client_id,
    title: validatedPayload.title,
    tipo_cliente: validatedPayload.tipo_cliente,
    canal_jornada: validatedPayload.canal_jornada,
    endpoint: validatedPayload.endpoint,
    method: validatedPayload.http_method,
    payload_request: validatedPayload.payload_request,
    payload_response: validatedPayload.payload_response,
    occurred_at: validatedPayload.occurred_at,
    http_status_code: validatedPayload.http_status_code,
    description: validatedPayload.description,
    id_version_api: validatedPayload.id_version_api,
    category_name: validatedPayload.category_data.category_name,
    sub_category_name: validatedPayload.category_data.sub_category_name,
    third_level_category_name: validatedPayload.category_data.third_level_category_name,
    data_template: filteredTemplateData,
  };

  const createdIncident = await applicationIncidentRepository.createIncident(normalizedPayload);
  return normalizeIncidentRow({
    ...createdIncident,
    team_slug: owner.slug,
    team_name: owner.name,
  });
}

async function listApplicationIncidents(teamSlug, { limit, offset } = {}) {
  const normalizedTeamSlug = normalizeTeamSlug(teamSlug);
  const incidents = await applicationIncidentRepository.listIncidentsByOwnerSlug(
    normalizedTeamSlug,
    { limit, offset }
  );
  return incidents.map(normalizeIncidentRow);
}

async function getApplicationIncidentById(teamSlug, incidentId) {
  const normalizedTeamSlug = normalizeTeamSlug(teamSlug);
  const normalizedIncidentId = Number(incidentId);

  if (!Number.isInteger(normalizedIncidentId) || normalizedIncidentId <= 0) {
    throw buildError('Path param "incidentId" is required.');
  }

  const incident = await incidentTicketRepository.getIncidentTicketContext(
    normalizedTeamSlug,
    normalizedIncidentId
  );

  if (!incident) {
    throw buildError('Incidente não encontrado.', 404);
  }

  return normalizeIncidentRow(incident);
}

async function assignApplicationIncidentToUser(teamSlug, incidentId, payload = {}) {
  const normalizedTeamSlug = normalizeTeamSlug(teamSlug);
  const normalizedIncidentId = Number(incidentId);

  if (!Number.isInteger(normalizedIncidentId) || normalizedIncidentId <= 0) {
    throw buildError('Path param "incidentId" is required.');
  }

  if (!payload.assigned_to_user_id) {
    throw buildError('Usuário autenticado não encontrado.', 401);
  }

  const incident = await applicationIncidentRepository.assignIncidentToUser(
    normalizedTeamSlug,
    normalizedIncidentId,
    {
      incident_status: INCIDENT_STATUS.ASSIGNED,
      assigned_to_user_id: payload.assigned_to_user_id,
    }
  );

  if (!incident) {
    throw buildError('Incidente não encontrado.', 404);
  }

  try {
    return normalizeIncidentRow(incident);
  } catch (error) {
    console.error('Error normalizing incident:', error.message, {
      incident: incident,
    });
    throw error;
  }
}

async function transitionApplicationIncident(teamSlug, incidentId, payload = {}) {
  const normalizedTeamSlug = normalizeTeamSlug(teamSlug);
  const normalizedIncidentId = Number(incidentId);

  if (!Number.isInteger(normalizedIncidentId) || normalizedIncidentId <= 0) {
    throw buildError('Path param "incidentId" is required.');
  }

  const requestedStatus = String(payload.incident_status || '').trim();
  const allowedStatuses = new Set([
    INCIDENT_STATUS.TICKET_CREATED,
    INCIDENT_STATUS.MONITORING,
    INCIDENT_STATUS.RESOLVED,
    INCIDENT_STATUS.CANCELED,
  ]);

  if (!allowedStatuses.has(requestedStatus)) {
    throw buildError(
      `Field "incident_status" must be one of: ${Array.from(allowedStatuses).join(', ')}.`
    );
  }

  const normalizedRelatedTicketId = normalizeRelatedTicketId(payload.related_ticket_id, {
    required: requestedStatus === INCIDENT_STATUS.TICKET_CREATED,
  });

  const currentIncident = await applicationIncidentRepository.getIncidentById(
    normalizedTeamSlug,
    normalizedIncidentId
  );

  if (!currentIncident) {
    throw buildError('Incidente não encontrado.', 404);
  }

  const incident = await applicationIncidentRepository.transitionIncident(
    normalizedTeamSlug,
    normalizedIncidentId,
    {
      incident_status: requestedStatus,
      related_ticket_id:
        normalizedRelatedTicketId ??
        (currentIncident.related_ticket_id ? Number(currentIncident.related_ticket_id) : null),
    }
  );

  return normalizeIncidentRow(incident);
}

module.exports = {
  assignApplicationIncidentToUser,
  getApplicationIncidentById,
  listApplicationIncidents,
  reportApplicationIncident,
  transitionApplicationIncident,
};
