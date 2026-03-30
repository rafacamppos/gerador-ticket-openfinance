const TICKET_STATUS_BY_ID = {
  '1': 'NOVO',
  '2': 'EM ANÁLISE N1',
  '3': 'EM ATENDIMENTO N1',
  '4': 'ATENDIMENTO ENCERRADO',
  '5': 'AGUARDANDO REQUISITANTE',
  '6': 'ENCAMINHADO N2 ATENDIMENTO',
  '7': 'EM ANÁLISE N2',
  '8': 'EM ATENDIMENTO N2',
  '9': 'ENCAMINHADO N1 ANÁLISE',
  '11': 'ENCERRADO PELO REQUISITANTE',
  '12': 'ATUALIZADO PELO REQUISITANTE',
  '13': 'REABERTO PELO REQUISITANTE',
  '15': 'AGUARDANDO IMPLEMENTAÇÃO N2',
  '17': 'AGUARDANDO REQUISITANTE - VALIDAÇÃO DA IMPLEMENTAÇÃO',
  '22': 'ENCAMINHADO PARA OPERAÇÃO DE MONITORAMENTO',
  '23': 'IMPLEMENTADA SOLUÇÃO PARCIAL',
  '24': 'CORREÇÃO IMPLEMENTADA',
  '25': 'AGUARDANDO VALIDAÇÃO DA NÃO CONFORMIDADE',
  '26': 'AGUARDANDO REEXECUÇÃO/CONTESTAÇÃO',
  '27': 'AGUARDANDO VALIDAÇÃO DA ESTRUTURA',
  '28': 'ENCAMINHADO PARA N3 OPERAÇÃO DE MONITORAMENTO',
  '29': 'ENCAMINHADO PARA N3 ANÁLISE TÉCNICA',
  '30': 'CANCELADO',
  '31': 'APROVAÇÃO CONCLUÍDA',
  '32': 'AGUARDANDO DADOS N3',
  '33': 'TODOS',
};

const IMMUTABLE_TICKET_STATUSES = new Set(['CANCELADO', 'ATENDIMENTO ENCERRADO']);

function normalizeTicketListQuery(query = {}) {
  const normalized = {};

  if (query.assignedGroup || query.assigned_group) {
    normalized.assigned_group = query.assignedGroup || query.assigned_group;
  }

  if (query.problemType || query.problem_type) {
    normalized.problem_type = query.problemType || query.problem_type;
  }

  return normalized;
}

function resolveTicketStatusFilter(query = {}) {
  if (!query.status && !query.status_id) {
    return null;
  }

  const rawStatus = String(query.status || query.status_id).trim();
  const resolvedStatus = TICKET_STATUS_BY_ID[rawStatus] || rawStatus;

  if (!resolvedStatus || resolvedStatus === 'TODOS') {
    return null;
  }

  return resolvedStatus;
}

function resolveOwnerSlugFilter(query = {}) {
  const ownerSlug = String(query.ownerSlug || query.owner_slug || '').trim();
  return ownerSlug || null;
}

function resolveTicketListOwner(ticket = {}) {
  return ticket?.flow?.current_owner_slug || ticket?.routing?.owner_slug || null;
}

function isImmutableTicketStatus(value) {
  return IMMUTABLE_TICKET_STATUSES.has(String(value || '').trim().toUpperCase());
}

function shouldHideFromOperationalQueue(ticket = {}) {
  return (
    isImmutableTicketStatus(ticket?.flow?.ticket_status) ||
    isImmutableTicketStatus(ticket?.ticket?.status)
  );
}

function normalizeTicketCreationQuery(query = {}) {
  return {
    type: query.type || '1',
    template: query.template,
  };
}

module.exports = {
  normalizeTicketCreationQuery,
  normalizeTicketListQuery,
  resolveOwnerSlugFilter,
  resolveTicketListOwner,
  resolveTicketStatusFilter,
  shouldHideFromOperationalQueue,
};
