const { buildError } = require('./openFinanceServiceErrors');
const { INCIDENT_STATUS } = require('../contracts/applicationIncidentContract');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');
const applicationIncidentRepository = require('../repositories/applicationIncidentRepository');
const { normalizeIncidentRow } = require('./applicationIncidentMapper');
const openFinanceDeskClient = require('../clients/openFinanceDeskClient');

/**
 * Resolves a list field value using the field's list_options map.
 *
 * Supported key formats in list_options:
 *   "=<value>"  — exact match with higher priority (e.g. "=429")
 *   "<digit>xx" — first-digit range match           (e.g. "4xx", "5xx")
 *   "*"         — default/wildcard
 *   "<label>"   — direct label match               (e.g. "PF", "App to app")
 */
function resolveListOption(listOptions, rawValue) {
  const str = String(rawValue);

  if (listOptions[`=${str}`] !== undefined) return listOptions[`=${str}`];
  if (listOptions[str]        !== undefined) return listOptions[str];

  const rangeKey = `${str[0]}xx`;
  if (listOptions[rangeKey]   !== undefined) return listOptions[rangeKey];

  return listOptions['*'] ?? '';
}

function extractFieldValue(field, context) {
  const raw = context[field.context_key];
  if (raw === undefined || raw === null || raw === '') return '';

  if (field.list_options) {
    return resolveListOption(field.list_options, raw);
  }

  if (typeof raw === 'object') return JSON.stringify(raw);

  return String(raw);
}

function buildBaseFields(context) {
  return [
    { key: 'title',                value: context.title || '' },
    { key: 'description',          value: context.description || '' },
    { key: 'problem_type',         value: context.category_name || '' },
    { key: 'problem_sub_type',     value: context.sub_category_name || '' },
    { key: 'third_level_category', value: context.third_level_category_name || '' },
  ];
}

function buildInfoPayload(templateFields, context) {
  const missing = [];

  const customFields = templateFields.map((field) => {
    const value = extractFieldValue(field, context);

    if (field.is_required && !value) {
      missing.push(field.field_name);
    }

    return { key: field.field_label_api, value };
  });

  const info = [...buildBaseFields(context), ...customFields];

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
    title: ctx.description || '',
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
