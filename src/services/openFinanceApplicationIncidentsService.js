const { buildError } = require('./openFinanceServiceErrors');
const { INCIDENT_STATUS } = require('../contracts/applicationIncidentContract');
const ticketOwnerRepository = require('../repositories/ticketOwnerRepository');
const applicationIncidentRepository = require('../repositories/applicationIncidentRepository');
const { normalizeIncidentRow } = require('./applicationIncidentMapper');
const {
  normalizeEndpoint,
  normalizeErrorPayload,
  normalizeHttpMethod,
  normalizeHttpStatusCode,
  normalizeRelatedTicketId,
  normalizeTeamSlug,
  normalizeTimestamp,
  normalizeUuid,
} = require('./applicationIncidentValidation');

async function reportApplicationIncident(teamSlug, payload = {}) {
  const owner = await ticketOwnerRepository.getActiveOwnerBySlug(normalizeTeamSlug(teamSlug));

  if (!owner) {
    throw buildError('Equipe não encontrada.', 404);
  }

  const normalizedPayload = {
    ticket_owner_id: owner.id,
    team_slug: owner.slug,
    team_name: owner.name,
    x_fapi_interaction_id: normalizeUuid(
      payload.x_fapi_interaction_id,
      'x_fapi_interaction_id'
    ),
    authorization_server: normalizeUuid(
      payload.authorization_server,
      'authorization_server'
    ),
    client_id: normalizeUuid(
      payload.client_id,
      'client_id'
    ),
    endpoint: normalizeEndpoint(payload.endpoint),
    method: normalizeHttpMethod(payload.method),
    error_payload: normalizeErrorPayload(payload.error_payload),
    occurred_at: normalizeTimestamp(payload.occurred_at),
    http_status_code: normalizeHttpStatusCode(payload.http_status_code),
  };

  const createdIncident = await applicationIncidentRepository.createIncident(normalizedPayload);
  return normalizeIncidentRow({
    ...createdIncident,
    team_slug: owner.slug,
    team_name: owner.name,
  });
}

async function listApplicationIncidents(teamSlug) {
  const normalizedTeamSlug = normalizeTeamSlug(teamSlug);
  const incidents = await applicationIncidentRepository.listIncidentsByOwnerSlug(normalizedTeamSlug);
  return incidents.map(normalizeIncidentRow);
}

async function getApplicationIncidentById(teamSlug, incidentId) {
  const normalizedTeamSlug = normalizeTeamSlug(teamSlug);
  const normalizedIncidentId = Number(incidentId);

  if (!Number.isInteger(normalizedIncidentId) || normalizedIncidentId <= 0) {
    throw buildError('Path param "incidentId" is required.');
  }

  const incident = await applicationIncidentRepository.getIncidentById(
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

  if (!payload.assigned_to_name || !payload.assigned_to_email) {
    throw buildError('Usuário autenticado não encontrado.', 401);
  }

  const incident = await applicationIncidentRepository.assignIncidentToUser(
    normalizedTeamSlug,
    normalizedIncidentId,
    {
      incident_status: INCIDENT_STATUS.ASSIGNED,
      assigned_to_user_id: payload.assigned_to_user_id || null,
      assigned_to_name: payload.assigned_to_name,
      assigned_to_email: payload.assigned_to_email,
    }
  );

  if (!incident) {
    throw buildError('Incidente não encontrado.', 404);
  }

  return normalizeIncidentRow(incident);
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
  normalizeIncidentRow,
  reportApplicationIncident,
  transitionApplicationIncident,
};
