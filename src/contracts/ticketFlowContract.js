const SANTANDER_REQUESTER_NAME = 'BCO SANTANDER (BRASIL) S.A.';

const TICKET_FLOW_STAGES = {
  TRIAGE_SU: 'triage_su',
  ROUTED_TO_OWNER: 'routed_to_owner',
  ACCEPTED_BY_OWNER: 'accepted_by_owner',
  RETURNED_TO_SU: 'returned_to_su',
  RESPONDED_BY_OWNER: 'responded_by_owner',
  CLOSED_CANCELED: 'closed_canceled',
};

const TICKET_FLOW_ACTIONS = {
  ROUTE_TO_OWNER: 'route_to_owner',
  ACCEPT: 'accept',
  RESPOND: 'respond',
  RETURN_TO_SU: 'return_to_su',
  REJECT: 'reject',
  CLOSED: 'closed',
  CANCELED: 'canceled',
};

const TICKET_FLOW_STAGE_LABELS = {
  [TICKET_FLOW_STAGES.TRIAGE_SU]: 'Triagem SU',
  [TICKET_FLOW_STAGES.ROUTED_TO_OWNER]: 'Encaminhado para equipe',
  [TICKET_FLOW_STAGES.ACCEPTED_BY_OWNER]: 'Aceito pela equipe',
  [TICKET_FLOW_STAGES.RETURNED_TO_SU]: 'Devolvido ao SU',
  [TICKET_FLOW_STAGES.RESPONDED_BY_OWNER]: 'Respondido pela equipe',
  [TICKET_FLOW_STAGES.CLOSED_CANCELED]: 'Encerrado/Cancelado',
};

const TICKET_FLOW_ACTION_LABELS = {
  [TICKET_FLOW_ACTIONS.ROUTE_TO_OWNER]: 'Encaminhamento',
  [TICKET_FLOW_ACTIONS.ACCEPT]: 'Aceite',
  [TICKET_FLOW_ACTIONS.RESPOND]: 'Resposta',
  [TICKET_FLOW_ACTIONS.RETURN_TO_SU]: 'Devolução ao SU',
  [TICKET_FLOW_ACTIONS.REJECT]: 'Recusa',
  [TICKET_FLOW_ACTIONS.CLOSED]: 'Encerramento',
  [TICKET_FLOW_ACTIONS.CANCELED]: 'Cancelamento',
};

function getTicketFlowStageLabel(stage) {
  return TICKET_FLOW_STAGE_LABELS[stage] || 'Fluxo pendente';
}

function getTicketFlowActionLabel(action) {
  return TICKET_FLOW_ACTION_LABELS[action] || 'Atualização';
}

module.exports = {
  SANTANDER_REQUESTER_NAME,
  TICKET_FLOW_STAGES,
  TICKET_FLOW_ACTIONS,
  getTicketFlowStageLabel,
  getTicketFlowActionLabel,
};
