const { buildError } = require('./openFinanceServiceErrors');
const { INCIDENT_STATUS } = require('../contracts/applicationIncidentContract');
const { SANTANDER_REQUESTER_NAME } = require('../contracts/ticketFlowContract');
const incidentTicketRepository = require('../repositories/incidentTicketRepository');
const applicationIncidentRepository = require('../repositories/applicationIncidentRepository');
const ticketFlowRepository = require('../repositories/ticketFlowRepository');
const { normalizeIncidentRow } = require('./applicationIncidentMapper');
const openFinanceDeskClient = require('../clients/openFinanceDeskClient');
const { buildInitialStateSeed } = require('./ticketFlowTransitions');

const CONTEXT_KEY_EQUIVALENCES = {
  'titulo': 'title',
  'descricao': 'description',
};

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
  if (field.field_label_api === 'CustomColumn166sr') {
    return 'Não se Aplica';
  }

  let raw = context[field.context_key];

  if ((raw === undefined || raw === null) && CONTEXT_KEY_EQUIVALENCES[field.context_key]) {
    raw = context[CONTEXT_KEY_EQUIVALENCES[field.context_key]];
  }

  if ((raw === undefined || raw === null) && context.data_template) {
    raw = context.data_template[field.context_key];
  }

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
    { key: 'CustomColumn72sr',     value: context.client_id || '' },
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

function buildApiVersionFields(context) {
  return [
    { key: 'CustomColumn115sr', value: context.api_version || '' },
    { key: 'CustomColumn165sr', value: context.product_feature || '' },
    { key: 'CustomColumn114sr', value: context.stage_name_version || '' },
    { key: 'CustomColumn166sr', value: 'Não se Aplica' },
  ];
}

function buildInfoPayload(templateFields, context) {
  const missing = [];

  const customFields = templateFields.map((field) => {
    const value = extractFieldValue(field, context);

    if (field.is_required && !value) {
      missing.push(field.field_name);
    }

    console.log(`Template field ${field.field_label_api} (${field.context_key}): value="${value}"`);

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

  const baseFields = buildBaseFields(ctx);
  const baseFieldsForPreview = baseFields.map((field) => ({
    key:      field.key,
    label:    field.keyCaption || field.key,
    required: false,
    value:    field.value,
    options:  null,
  }));

  return {
    template_id:   String(ctx.template_id),
    template_type: ctx.template_type,
    title:         ctx.title       || '',
    description:   ctx.description || '',
    base_fields: baseFieldsForPreview,
    template_fields: templateFields.map((field) => {
      let raw = ctx[field.context_key];

      if ((raw === undefined || raw === null) && CONTEXT_KEY_EQUIVALENCES[field.context_key]) {
        raw = ctx[CONTEXT_KEY_EQUIVALENCES[field.context_key]];
      }

      if ((raw === undefined || raw === null) && ctx.data_template) {
        raw = ctx.data_template[field.context_key];
      }

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

async function createTicketFromIncident(teamSlug, incidentId, payload, headers, context, actor = {}) {
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

  const authenticatedUserId = actor.authenticated_user_id
    ? String(actor.authenticated_user_id)
    : null;

  if (!authenticatedUserId) {
    throw buildError('Usuário autenticado não encontrado.', 401);
  }

  if (!ctx.assigned_to_user_id) {
    throw buildError('O incidente precisa ser atribuído antes da criação do ticket.', 409);
  }

  if (String(ctx.assigned_to_user_id) !== authenticatedUserId) {
    throw buildError('Somente o usuário responsável pelo incidente pode criar o ticket.', 403);
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

  console.log(`Template ${ctx.template_id} has ${templateFields.length} fields:`,
    templateFields.map(f => ({ field_label_api: f.field_label_api, context_key: f.context_key }))
  );

  const enrichedContext = {
    ...ctx,
    title:                payload.title                || ctx.title                || '',
    description:          payload.description          || ctx.description          || '',
    api_name_version:     payload.api_name_version     || ctx.api_name_version     || '',
    api_version:          payload.api_version          || ctx.api_version          || '',
    product_feature:      payload.product_feature      || ctx.product_feature      || '',
    stage_name_version:   payload.stage_name_version   || ctx.stage_name_version   || '',
    http_status_code:     payload.http_status_code     || ctx.http_status_code     || '',
  };

  console.log('Enriched context for ticket creation:', {
    client_id: enrichedContext.client_id,
    api_name_version: enrichedContext.api_name_version,
    api_version: enrichedContext.api_version,
    product_feature: enrichedContext.product_feature,
    stage_name_version: enrichedContext.stage_name_version,
  });

  const baseFields = buildBaseFields(enrichedContext);
  console.log('Base fields created:', baseFields.map(f => ({ key: f.key, value: f.value })));
  const apiVersionFields = buildApiVersionFields(enrichedContext);

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

  // Remove duplicate api_version fields that may already exist in customFields
  const customFieldKeys = new Set(customFields.map(f => f.key));
  const apiVersionFieldsToAdd = apiVersionFields.filter(f => !customFieldKeys.has(f.key));

  const info = [...baseFields, ...apiVersionFieldsToAdd, ...customFields];

  const ticketPayload = { info };
  console.log('Creating ticket from incident - ServiceDesk payload:', JSON.stringify({
    incidentId: Number(incidentId),
    teamSlug,
    template: ctx.template_id,
    type: ctx.template_type,
    fieldsCount: info.length,
    fields: info.map(f => ({ key: f.key, valueType: typeof f.value, hasValue: !!f.value })),
    fullPayload: ticketPayload,
  }, null, 2));

  const ticketResponse = await openFinanceDeskClient.postJson(
    '/sr',
    ticketPayload,
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
    actor: {
      name: ctx.assigned_to_name || null,
      email: ctx.assigned_to_email || null,
    },
    assignment: {
      instituicao_requerente: SANTANDER_REQUESTER_NAME,
    },
  });

  if (!initialFlowState) {
    throw buildError('Não foi possível inicializar o fluxo do ticket criado.', 500, {
      ticketResponse,
      incidentId: Number(incidentId),
    });
  }

  await ticketFlowRepository.upsertInitialStateWithEvent(initialFlowState);

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
