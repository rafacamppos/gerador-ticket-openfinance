const { getPool } = require('../clients/postgresClient');
const {
  buildListStatesQuery,
  buildUpsertInitialStatesQuery,
} = require('./ticketFlowStateQueries');
const {
  ensureStateExists,
  insertEvent,
  updateState,
} = require('./ticketFlowTransitionRepository');

async function upsertInitialStates(states = []) {
  if (!Array.isArray(states) || !states.length) {
    return [];
  }
  const query = buildUpsertInitialStatesQuery(states);
  const result = await getPool().query(query.text, query.values);

  return result.rows;
}

const STATE_SELECT = `
  SELECT
    tfs.*,
    towner.name AS current_owner_name,
    aowner.name AS assigned_owner_name,
    evt.actor_name AS last_actor_name,
    evt.actor_email AS last_actor_email,
    evt.action AS last_action
  FROM ticket_flow_states tfs
  LEFT JOIN ticket_owners towner ON towner.slug = tfs.current_owner_slug
  LEFT JOIN ticket_owners aowner ON aowner.slug = tfs.assigned_owner_slug
  LEFT JOIN LATERAL (
    SELECT actor_name, actor_email, action
    FROM ticket_flow_events
    WHERE ticket_id = tfs.ticket_id
    ORDER BY created_at DESC
    LIMIT 1
  ) evt ON TRUE
`;

async function getStateByTicketId(ticketId) {
  const result = await getPool().query(
    `${STATE_SELECT} WHERE tfs.ticket_id = $1`,
    [Number(ticketId)]
  );

  return result.rows[0] || null;
}

async function getStatesByTicketIds(ticketIds = []) {
  const normalizedIds = ticketIds
    .map((ticketId) => Number(ticketId))
    .filter((ticketId) => Number.isFinite(ticketId));

  if (!normalizedIds.length) {
    return [];
  }

  const result = await getPool().query(
    `${STATE_SELECT} WHERE tfs.ticket_id = ANY($1::bigint[])`,
    [normalizedIds]
  );

  return result.rows;
}

async function listStates(filters = {}) {
  const query = buildListStatesQuery(filters);
  const result = await getPool().query(query.text, query.values);

  return result.rows;
}

async function listEventsByTicketId(ticketId) {
  const result = await getPool().query(
    `
      SELECT *
      FROM ticket_flow_events
      WHERE ticket_id = $1
      ORDER BY created_at DESC, id DESC
    `,
    [Number(ticketId)]
  );

  return result.rows;
}

async function transitionState(ticketId, transition) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const previousState = await ensureStateExists(client, ticketId, transition);
    const nextState = transition.next_state;
    const updatedState = await updateState(client, ticketId, nextState, transition.action);
    await insertEvent(client, ticketId, transition, previousState, updatedState);

    await client.query('COMMIT');
    return updatedState;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getStateByTicketId,
  getStatesByTicketIds,
  listEventsByTicketId,
  listStates,
  transitionState,
  upsertInitialStates,
};
