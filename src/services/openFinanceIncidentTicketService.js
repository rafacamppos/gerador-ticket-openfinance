const { buildError } = require('./openFinanceServiceErrors');
const { INCIDENT_STATUS } = require('../contracts/applicationIncidentContract');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');
const applicationIncidentRepository = require('../repositories/applicationIncidentRepository');
const ticketFlowRepository = require('../repositories/ticketFlowRepository');
const { normalizeIncidentRow } = require('./applicationIncidentMapper');
const openFinanceDeskClient = require('../clients/openFinanceDeskClient');
const { buildInitialStateSeed } = require('./ticketFlowTransitions');

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

function buildProblemTypeValue(context) {
  const parts = [
    'Incidentes',
    context.category_name,
    context.sub_category_name,
    context.third_level_category_name,
  ].filter(Boolean);

  return parts.join('_');
}

function buildBaseFields(context) {
  return [
    { key: 'title',                value: context.title || '' },
    { key: 'description',          value: context.description || '' },
    { key: 'problem_type',         value: buildProblemTypeValue(context) },
    {
      key: 'CustomColumn16sr',
      value: 'N1 Service Desk',
      valueClass: '',
      valueCaption: 'N1 Service Desk',
      keyCaption: 'Equipe solucionadora',
    },
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

/**
 * Extracts the human-readable option keys from a list_options map,
 * filtering out resolution patterns (=<val>, <digit>xx, *).
 * These are the valid raw values a user can select/submit.
 */
function extractDisplayOptions(listOptions) {
  if (!listOptions) return null;
  const directKeys = Object.keys(listOptions).filter(
    (k) => !k.startsWith('=') && !/^[0-9]xx$/.test(k) && k !== '*'
  );
  return directKeys.length > 0 ? directKeys : null;
}

async function getTicketPreview(teamSlug, incidentId) {
  const ctx = await incidentTicketRepository.getIncidentTicketContext(
    String(teamSlug || '').trim(),
    Number(incidentId)
  );

  if (!ctx) {
    throw buildError('Incidente não encontrado.', 404);
  }

  if (!ctx.template_id) {
    throw buildError(
      'Nenhum template de ticket encontrado para o endpoint deste incidente.',
      422
    );
  }

  const templateFields = await incidentTicketRepository.getTemplateFields(ctx.template_id);

  return {
    template_id:   String(ctx.template_id),
    template_type: ctx.template_type,
    title:         ctx.title       || '',
    description:   ctx.description || '',
    template_fields: templateFields.map((field) => {
      const raw = ctx[field.context_key];
      const value = raw === null || raw === undefined
        ? ''
        : typeof raw === 'object'
          ? JSON.stringify(raw, null, 2)
          : String(raw);
      return {
        key:      field.field_label_api,
        label:    field.field_name,
        required: field.is_required || false,
        value,
        options:  extractDisplayOptions(field.list_options),
      };
    }),
  };
}

async function createTicketFromIncident(teamSlug, incidentId, payload, headers, context) {
  const ctx = await incidentTicketRepository.getIncidentTicketContext(
    String(teamSlug || '').trim(),
    Number(incidentId)
  );

  if (!ctx) {
    throw buildError('Incidente não encontrado.', 404);
  }

  if (ctx.related_ticket_id) {
    throw buildError('Um ticket já foi vinculado a este incidente.', 409, {
      related_ticket_id: String(ctx.related_ticket_id),
    });
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
    title:       payload.title       || ctx.title       || '',
    description: payload.description || ctx.description || '',
  };

  const baseFields = buildBaseFields(enrichedContext);

  let customFields;
  if (Array.isArray(payload.template_fields) && payload.template_fields.length > 0) {
    const fieldByKey = new Map(templateFields.map((f) => [f.field_label_api, f]));
    customFields = payload.template_fields.map(({ key, value }) => {
      const field = fieldByKey.get(key);
      const resolved = field?.list_options
        ? resolveListOption(field.list_options, value)
        : String(value ?? '');
      return { key, value: resolved };
    });
  } else {
    const { info: autoInfo, missing } = buildInfoPayload(templateFields, enrichedContext);
    if (missing.length) {
      throw buildError(`Campos obrigatórios não preenchidos: ${missing.join(', ')}.`, 422);
    }
    customFields = autoInfo.filter((f) => !baseFields.some((b) => b.key === f.key));
  }

  const info = [...baseFields, ...customFields];

  const ticketResponse = await openFinanceDeskClient.postJson(
    '/sr',
    { info },
    { template: ctx.template_id, type: ctx.template_type },
    headers,
    context
  );

  const createdTicketId = ticketResponse?.id ? Number(ticketResponse.id) : null;

  if (!createdTicketId) {
    throw buildError('ServiceDesk não retornou o identificador do ticket criado.', 502, ticketResponse);
  }

  const initialFlowState = buildInitialStateSeed({
    ticket: {
      id: createdTicketId,
      title: ticketResponse?.title || enrichedContext.title || ctx.title || null,
      status: ticketResponse?.status || 'NOVO',
    },
    routing: {
      owner_slug: ctx.team_slug || String(teamSlug || '').trim() || null,
      owner_name: ctx.team_name || null,
    },
  });

  if (!initialFlowState) {
    throw buildError('Não foi possível inicializar o fluxo do ticket criado.', 500, {
      ticketResponse,
      incidentId: Number(incidentId),
    });
  }

  await ticketFlowRepository.upsertInitialStates([initialFlowState]);

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
  getTicketPreview,
};
