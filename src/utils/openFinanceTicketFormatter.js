const {
  asArray,
  mapEscopo,
  mapTipoCliente,
  normalizeApiPayload,
  normalizeDateTime,
  normalizeDescriptionFull,
  normalizeMillis,
  summarizeDescription,
  toBoolean,
} = require('./openFinanceFormatterShared');
const {
  buildDirectFieldMap,
  buildInfoFieldMap,
  getField,
} = require('./openFinanceFieldMap');
const {
  collectRawFields,
  normalizeActivity,
  normalizeAttachment,
  normalizeNote,
} = require('./openFinanceTicketEntries');

function formatTicket(ticket = {}, options = {}) {
  const directFieldMap = buildDirectFieldMap(ticket);
  const infoFieldMap = buildInfoFieldMap(ticket);
  const serviceDeskBaseUrl = String(options.serviceDeskBaseUrl || '').replace(/\/+$/, '') || null;
  const descriptionFull = normalizeDescriptionFull(
    getField(directFieldMap, infoFieldMap, ['description'])
  );

  const insertTimeRaw = getField(directFieldMap, infoFieldMap, ['insert_time']);
  const updateTimeRaw = getField(directFieldMap, infoFieldMap, ['update_time', 'uptade_time']);
  const closeTimeRaw = getField(directFieldMap, infoFieldMap, ['close_time']);
  const dueDateRaw = getField(directFieldMap, infoFieldMap, ['due_date']);

  return {
    ticket: {
      id: String(getField(directFieldMap, infoFieldMap, ['id'], ticket.id || '')),
      title: getField(directFieldMap, infoFieldMap, ['title']),
      description: {
        summary: summarizeDescription(descriptionFull),
        full: descriptionFull,
      },
      status: getField(directFieldMap, infoFieldMap, ['status']),
      type: getField(directFieldMap, infoFieldMap, ['type']),
      sr_type: getField(directFieldMap, infoFieldMap, ['sr_type', 'type']),
      template: getField(directFieldMap, infoFieldMap, ['template']),
      category: {
        nivel1: getField(directFieldMap, infoFieldMap, ['problem_type']),
        nivel2: getField(directFieldMap, infoFieldMap, ['problem_sub_type']),
        nivel3: getField(directFieldMap, infoFieldMap, ['third_level_category', 'sub_type']),
      },
    },

    api_context: {
      endpoint: getField(directFieldMap, infoFieldMap, ['CustomColumn68sr']),
      http_status: getField(directFieldMap, infoFieldMap, ['CustomColumn70sr']),
      interaction_id: getField(directFieldMap, infoFieldMap, ['CustomColumn156sr']),
      request: normalizeApiPayload(getField(directFieldMap, infoFieldMap, ['CustomColumn69sr'], null)),
      response: normalizeApiPayload(getField(directFieldMap, infoFieldMap, ['CustomColumn71sr'], null)),
    },

    sla: {
      sla_dias: getField(directFieldMap, infoFieldMap, ['CustomColumn171sr']),
      sla_atraso: getField(directFieldMap, infoFieldMap, ['CustomColumn170sr']),
      status: getField(directFieldMap, infoFieldMap, ['CustomColumn33sr']),
      due_date: normalizeDateTime(dueDateRaw),
      due_date_ms: normalizeMillis(dueDateRaw),
    },

    assignment: {
      solicitante: getField(directFieldMap, infoFieldMap, ['request_user']),
      instituicao_requerente: getField(directFieldMap, infoFieldMap, [
        'CustomColumn155sr',
        'company',
        'company_name',
      ]),
      responsavel: getField(directFieldMap, infoFieldMap, ['responsibility']),
      grupo: getField(directFieldMap, infoFieldMap, ['assigned_group']),
      nivel_suporte_atual: getField(directFieldMap, infoFieldMap, ['current_support_level']),
    },

    analysis: {
      erro_tipo: getField(directFieldMap, infoFieldMap, ['CustomColumn119sr']),
      procedente: toBoolean(getField(directFieldMap, infoFieldMap, ['CustomColumn129sr'])),
      escopo: mapEscopo(getField(directFieldMap, infoFieldMap, ['CustomColumn164sr'])),
      monitoramento: toBoolean(getField(directFieldMap, infoFieldMap, ['CustomColumn172sr'])),
      tipo_cliente: mapTipoCliente(getField(directFieldMap, infoFieldMap, ['CustomColumn120sr'])),
    },

    solution: {
      descricao: getField(directFieldMap, infoFieldMap, ['solution']),
      workaround: getField(directFieldMap, infoFieldMap, ['workaround']),
      data_prevista_implementacao: normalizeDateTime(
        getField(directFieldMap, infoFieldMap, ['CustomColumn82sr'])
      ),
      data_prevista_implementacao_ms: normalizeMillis(
        getField(directFieldMap, infoFieldMap, ['CustomColumn82sr'])
      ),
    },

    timestamps: {
      criado_em: normalizeDateTime(insertTimeRaw),
      criado_em_ms: normalizeMillis(insertTimeRaw),
      atualizado_em: normalizeDateTime(updateTimeRaw),
      atualizado_em_ms: normalizeMillis(updateTimeRaw),
      encerrado_em: normalizeDateTime(closeTimeRaw),
      encerrado_em_ms: normalizeMillis(closeTimeRaw),
    },

    lifecycle: {
      reopen_counter: getField(directFieldMap, infoFieldMap, ['reopen_counter']),
      archived: toBoolean(getField(directFieldMap, infoFieldMap, ['archive'])),
    },

    notes: asArray(getField(directFieldMap, infoFieldMap, ['notes'], ticket.notes || []))
      .filter((entry) => entry && typeof entry === 'object')
      .map(normalizeNote),

    activities: asArray(getField(directFieldMap, infoFieldMap, ['activities', 'history'], ticket.activities || []))
      .filter((entry) => entry && typeof entry === 'object')
      .map(normalizeActivity),

    attachments: asArray(getField(directFieldMap, infoFieldMap, ['attachments'], ticket.attachments || []))
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) =>
        normalizeAttachment(
          entry,
          getField(directFieldMap, infoFieldMap, ['id'], ticket.id || null),
          serviceDeskBaseUrl
        )
      ),

    raw_fields: collectRawFields(ticket),
  };
}

function formatTicketList(payload, options = {}) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((ticket) => formatTicket(ticket, options));
}

module.exports = {
  formatTicket,
  formatTicketList,
};
