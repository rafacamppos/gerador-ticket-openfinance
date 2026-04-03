const logger = require('../utils/logger');
const {
  normalizeBoolean,
  normalizeEventRow,
  normalizeStateRow,
} = require('./ticketFlowNormalization');
const {
  IMMUTABLE_TICKET_STATUSES,
  buildInitialStateSeed,
  buildTransition,
} = require('./ticketFlowTransitions');

function getTicketFlowRepository() {
  return require('../repositories/ticketFlowRepository');
}

async function syncTicketFlows(tickets = []) {
  try {
    const repository = getTicketFlowRepository();
    const states = tickets.map(buildInitialStateSeed).filter(Boolean);
    if (!states.length) {
      return [];
    }

    const existingStates = await repository.getStatesByTicketIds(states.map((state) => state.ticket_id));
    const existingStateMap = new Map(
      existingStates.map((state) => [String(state.ticket_id), state])
    );

    const statesToPersist = states.filter((state) => {
      const isImmutableStatus = IMMUTABLE_TICKET_STATUSES.has(
        String(state.ticket_status || '').trim().toUpperCase()
      );

      if (!isImmutableStatus) {
        return true;
      }

      return !existingStateMap.has(String(state.ticket_id));
    });

    if (!statesToPersist.length) {
      return [];
    }

    return await repository.upsertInitialStates(statesToPersist);
  } catch (error) {
    logger.error('Ticket flow synchronization failed', {
      errorMessage: error.message,
    });
    return [];
  }
}

async function attachFlowStates(tickets = []) {
  if (!Array.isArray(tickets) || !tickets.length) {
    return tickets;
  }

  try {
    const repository = getTicketFlowRepository();
    const ids = tickets.map((ticket) => ticket?.ticket?.id).filter(Boolean);
    const states = await repository.getStatesByTicketIds(ids);
    const stateMap = new Map(
      states.filter(Boolean).map((state) => [String(state.ticket_id), normalizeStateRow(state)])
    );

    return tickets.map((ticket) => ({
      ...ticket,
      flow: stateMap.get(String(ticket?.ticket?.id || '')) || null,
    }));
  } catch (error) {
    logger.error('Ticket flow enrichment failed', {
      errorMessage: error.message,
    });
    return tickets;
  }
}

async function getTicketFlow(ticketId) {
  const repository = getTicketFlowRepository();
  const [state, events] = await Promise.all([
    repository.getStateByTicketId(ticketId),
    repository.listEventsByTicketId(ticketId),
  ]);

  return {
    state: state ? normalizeStateRow(state) : null,
    events: events.map(normalizeEventRow),
  };
}

async function listTicketFlows(query = {}) {
  const repository = getTicketFlowRepository();
  const rows = await repository.listStates({
    current_owner_slug: query.currentOwnerSlug || query.current_owner_slug || null,
    current_stage: query.currentStage || query.current_stage || null,
    accepted_by_team: normalizeBoolean(query.acceptedByTeam || query.accepted_by_team),
    responded_by_team: normalizeBoolean(query.respondedByTeam || query.responded_by_team),
    returned_to_su: normalizeBoolean(query.returnedToSu || query.returned_to_su),
  });

  return rows.map(normalizeStateRow);
}

async function transitionTicketFlow(ticketId, payload = {}) {
  const repository = getTicketFlowRepository();
  const currentState = await repository.getStateByTicketId(ticketId);
  const transition = buildTransition(currentState ? normalizeStateRow(currentState) : null, {
    ...payload,
    ticketId,
  });

  const updatedState = await repository.transitionState(ticketId, transition);
  const events = await repository.listEventsByTicketId(ticketId);

  return {
    state: normalizeStateRow(updatedState),
    events: events.map(normalizeEventRow),
  };
}

module.exports = {
  attachFlowStates,
  getTicketFlow,
  listTicketFlows,
  syncTicketFlows,
  transitionTicketFlow,
};
