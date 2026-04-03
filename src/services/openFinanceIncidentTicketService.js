const { buildError } = require('./openFinanceServiceErrors');
const { INCIDENT_STATUS } = require('../contracts/applicationIncidentContract');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');
const applicationIncidentRepository = require('../repositories/applicationIncidentRepository');
const { normalizeIncidentRow } = require('./applicationIncidentMapper');
const openFinanceDeskClient = require('../clients/openFinanceDeskClient');

/**
 * Maps known service-desk field codes (field_label_api) to value extractors.
 * The context object contains all enriched incident data including API version
 * and financial institution details resolved at query time.
 */
const FIELD_EXTRACTORS = {
  CustomColumn38sr:  (ctx) => ctx.destinatario || '',
  CustomColumn72sr:  (ctx) => ctx.client_id || '',
  CustomColumn68sr:  (ctx) => `${ctx.method} ${ctx.endpoint}`,
  CustomColumn69sr:  (ctx) => JSON.stringify(ctx.payload_request || {}),
  CustomColumn229sr: (ctx) => String(ctx.http_status_code || ''),
  CustomColumn71sr:  (ctx) => JSON.stringify(ctx.payload_response || {}),
  CustomColumn114sr: (ctx) => ctx.api_name_version || '',
  CustomColumn115sr: (ctx) => ctx.api_version || '',
  CustomColumn165sr: (ctx) => ctx.product_feature || '',
  CustomColumn166sr: (ctx) => ctx.stage_name_version || '',
  CustomColumn120sr: (ctx) => ctx.tipo_cliente || '',
  CustomColumn174sr: (ctx) => ctx.canal_jornada || '',
  CustomColumn156sr: (ctx) => ctx.x_fapi_interaction_id || '',
};

function buildInfoPayload(templateFields, context) {
  const missing = [];

  const info = templateFields.map((field) => {
    const extractor = FIELD_EXTRACTORS[field.field_label_api];
    const value = extractor ? extractor(context) : '';

    if (field.is_required && !value) {
      missing.push(field.field_name);
    }

    return { field: field.field_label_api, value };
  });

  return { info, missing };
}

async function createTicketFromIncident(teamSlug, incidentId, payload, headers, context) {
  const ctx = await incidentTicketRepository.getIncidentTicketContext(
    String(teamSlug || '').trim(),
    Number(incidentId)
  );

  if (!ctx) {
    throw buildError('Incidente não encontrado.', 404);
  }

  if (ctx.incident_status === INCIDENT_STATUS.TICKET_CREATED) {
    throw buildError('Um ticket já foi criado para este incidente.', 409);
  }

  if (!ctx.template_id) {
    throw buildError(
      'Nenhum template de ticket encontrado para o endpoint deste incidente.',
      422
    );
  }

  const templateFields = await incidentTicketRepository.getTemplateFields(ctx.template_id);

  if (!templateFields.length) {
    throw buildError(
      `Nenhum campo de template encontrado para o template ${ctx.template_id}.`,
      422
    );
  }

  const enrichedContext = {
    ...ctx,
    tipo_cliente: String(payload.tipo_cliente || '').trim(),
    canal_jornada: String(payload.canal_jornada || '').trim(),
  };

  const { info, missing } = buildInfoPayload(templateFields, enrichedContext);

  if (missing.length) {
    throw buildError(
      `Campos obrigatórios não preenchidos: ${missing.join(', ')}.`,
      422
    );
  }

  const ticketResponse = await openFinanceDeskClient.postJson(
    '/sr',
    { info },
    { template: ctx.template_id, type: ctx.template_type },
    headers,
    context
  );

  const createdTicketId = ticketResponse?.id ? Number(ticketResponse.id) : null;

  const updatedIncident = await applicationIncidentRepository.transitionIncident(
    String(teamSlug || '').trim(),
    Number(incidentId),
    {
      incident_status: INCIDENT_STATUS.TICKET_CREATED,
      related_ticket_id: createdTicketId,
    }
  );

  return {
    incident: normalizeIncidentRow(updatedIncident),
    ticket_id: createdTicketId ? String(createdTicketId) : null,
    ticket: ticketResponse,
  };
}

module.exports = {
  buildInfoPayload,
  createTicketFromIncident,
};
