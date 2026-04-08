const { buildError } = require('./openFinanceServiceErrors');
const { TICKET_FLOW_ACTIONS, TICKET_FLOW_STAGES } = require('../contracts/ticketFlowContract');
const { normalizeRequesterCompanyKey } = require('./ticketFlowNormalization');

const SU_OWNER = {
  slug: 'su-super-usuarios',
  name: 'SU (Super Usuário)',
};

const IMMUTABLE_TICKET_STATUSES = new Set(['CANCELADO', 'ATENDIMENTO ENCERRADO']);

function buildInitialStateSeed(ticket = {}) {
  const ticketId = ticket?.ticket?.id;
  if (!ticketId) {
    return null;
  }

  const ticketStatus = ticket?.ticket?.status || null;
  const normalizedTicketStatus = String(ticketStatus || '').trim().toUpperCase();
  const ownerSlug = ticket?.routing?.owner_slug || null;
  const actorName = ticket?.actor?.name || null;
  const actorEmail = ticket?.actor?.email || null;
  const requesterCompanyName = ticket?.assignment?.instituicao_requerente || null;
  const isCanceled = normalizedTicketStatus === 'CANCELADO';
  const isClosed = normalizedTicketStatus === 'ATENDIMENTO ENCERRADO';
  const createdByOwner = ownerSlug && ownerSlug !== SU_OWNER.slug && actorName;
  const routedToOwner = ownerSlug && ownerSlug !== SU_OWNER.slug && !createdByOwner;

  let currentStage;
  let acceptedByTeam = false;
  let respondedByTeam = false;
  let returnedToSu = false;

  if (isClosed) {
    currentStage = TICKET_FLOW_STAGES.CLOSED_CANCELED;
    acceptedByTeam = true;
    respondedByTeam = true;
  } else if (isCanceled) {
    currentStage = TICKET_FLOW_STAGES.CLOSED_CANCELED;
    returnedToSu = true;
  } else if (createdByOwner) {
    currentStage = TICKET_FLOW_STAGES.ACCEPTED_BY_OWNER;
    acceptedByTeam = true;
  } else if (routedToOwner) {
    currentStage = TICKET_FLOW_STAGES.ROUTED_TO_OWNER;
  } else {
    currentStage = TICKET_FLOW_STAGES.TRIAGE_SU;
  }

  return {
    ticket_id: String(ticketId),
    ticket_title: ticket?.ticket?.title || null,
    ticket_status: ticketStatus,
    requester_company_name: requesterCompanyName,
    requester_company_key: normalizeRequesterCompanyKey(requesterCompanyName),
    current_stage: currentStage,
    current_owner_slug: ownerSlug,
    assigned_owner_slug: (createdByOwner || routedToOwner) ? ownerSlug : null,
    accepted_by_team: acceptedByTeam,
    responded_by_team: respondedByTeam,
    returned_to_su: returnedToSu,
    actor_name: actorName,
    actor_email: actorEmail,
  };
}

function buildTransition(currentState, payload = {}) {
  const action = String(payload.action || '').trim().toLowerCase();
  if (!action) {
    throw buildError('Field "action" is required for ticket flow transition.');
  }

  const actorName = String(payload.actorName || payload.actor_name || '').trim() || null;
  const actorEmail = String(payload.actorEmail || payload.actor_email || '').trim() || null;
  const note = String(payload.note || '').trim() || null;

  const baseState = currentState
    ? { ...currentState }
    : {
        ticket_id: String(payload.ticketId || ''),
        ticket_title: payload.ticketTitle || null,
        ticket_status: payload.ticketStatus || null,
        requester_company_name: payload.requesterCompanyName || null,
        requester_company_key: normalizeRequesterCompanyKey(payload.requesterCompanyName || null),
        current_stage: TICKET_FLOW_STAGES.TRIAGE_SU,
        current_owner_slug: SU_OWNER.slug,
        assigned_owner_slug: null,
        accepted_by_team: false,
        responded_by_team: false,
        returned_to_su: false,
      };

  const nextState = {
    ...baseState,
    ticket_title: payload.ticketTitle || baseState.ticket_title || null,
    ticket_status: payload.ticketStatus || baseState.ticket_status || null,
    requester_company_name:
      payload.requesterCompanyName || baseState.requester_company_name || null,
    requester_company_key: normalizeRequesterCompanyKey(
      payload.requesterCompanyName || baseState.requester_company_name || null
    ),
  };

  if (action === TICKET_FLOW_ACTIONS.ROUTE_TO_OWNER) {
    const targetOwnerSlug = String(payload.targetOwnerSlug || payload.target_owner_slug || '').trim();
    const targetOwnerName = String(payload.targetOwnerName || payload.target_owner_name || '').trim();

    if (!targetOwnerSlug || !targetOwnerName) {
      throw buildError(
        'Fields "targetOwnerSlug" and "targetOwnerName" are required for action "route_to_owner".'
      );
    }

    if (targetOwnerSlug === SU_OWNER.slug) {
      throw buildError('Action "route_to_owner" cannot target SU (Super Usuário).');
    }

    if (targetOwnerSlug === baseState.current_owner_slug) {
      throw buildError('Action "route_to_owner" cannot target the current owner.');
    }

    nextState.current_stage = TICKET_FLOW_STAGES.ROUTED_TO_OWNER;
    nextState.current_owner_slug = targetOwnerSlug;
    nextState.assigned_owner_slug = targetOwnerSlug;
    nextState.accepted_by_team = false;
    nextState.responded_by_team = false;
    nextState.returned_to_su = false;
  } else if (action === TICKET_FLOW_ACTIONS.ACCEPT) {
    nextState.current_stage = TICKET_FLOW_STAGES.ACCEPTED_BY_OWNER;
    nextState.accepted_by_team = true;
    nextState.returned_to_su = false;
  } else if (action === TICKET_FLOW_ACTIONS.RESPOND) {
    nextState.current_stage = TICKET_FLOW_STAGES.RESPONDED_BY_OWNER;
    nextState.responded_by_team = true;
    nextState.returned_to_su = false;
  } else if (
    action === TICKET_FLOW_ACTIONS.RETURN_TO_SU ||
    action === TICKET_FLOW_ACTIONS.REJECT
  ) {
    nextState.current_stage = TICKET_FLOW_STAGES.RETURNED_TO_SU;
    nextState.current_owner_slug = SU_OWNER.slug;
    nextState.returned_to_su = true;
    nextState.accepted_by_team = false;
  } else {
    throw buildError(`Unsupported ticket flow action "${action}".`);
  }

  return {
    action,
    actor_name: actorName,
    actor_email: actorEmail,
    note,
    initial_state: baseState,
    next_state: nextState,
    payload_json: payload,
  };
}

module.exports = {
  SU_OWNER,
  IMMUTABLE_TICKET_STATUSES,
  buildInitialStateSeed,
  buildTransition,
};
