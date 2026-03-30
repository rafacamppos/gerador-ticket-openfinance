async function ensureStateExists(client, ticketId, transition) {
  let stateResult = await client.query(
    `
      SELECT *
      FROM ticket_flow_states
      WHERE ticket_id = $1
      FOR UPDATE
    `,
    [Number(ticketId)]
  );

  if (stateResult.rows[0]) {
    return stateResult.rows[0];
  }

  const insertedState = await client.query(
    `
      INSERT INTO ticket_flow_states (
        ticket_id,
        ticket_title,
        ticket_status,
        requester_company_name,
        requester_company_key,
        current_stage,
        current_owner_slug,
        current_owner_name,
        assigned_owner_slug,
        assigned_owner_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      Number(ticketId),
      transition.initial_state.ticket_title || null,
      transition.initial_state.ticket_status || null,
      transition.initial_state.requester_company_name || null,
      transition.initial_state.requester_company_key || null,
      transition.initial_state.current_stage,
      transition.initial_state.current_owner_slug || null,
      transition.initial_state.current_owner_name || null,
      transition.initial_state.assigned_owner_slug || null,
      transition.initial_state.assigned_owner_name || null,
    ]
  );

  return insertedState.rows[0];
}

async function updateState(client, ticketId, nextState, action) {
  const updatedStateResult = await client.query(
    `
      UPDATE ticket_flow_states
      SET
        ticket_title = COALESCE($2, ticket_title),
        ticket_status = COALESCE($3, ticket_status),
        requester_company_name = COALESCE($4, requester_company_name),
        requester_company_key = COALESCE($5, requester_company_key),
        current_stage = $6,
        current_owner_slug = $7,
        current_owner_name = $8,
        assigned_owner_slug = $9,
        assigned_owner_name = $10,
        accepted_by_team = $11,
        responded_by_team = $12,
        returned_to_su = $13,
        last_actor_name = $14,
        last_actor_email = $15,
        last_action = $16,
        updated_at = NOW()
      WHERE ticket_id = $1
      RETURNING *
    `,
    [
      Number(ticketId),
      nextState.ticket_title || null,
      nextState.ticket_status || null,
      nextState.requester_company_name || null,
      nextState.requester_company_key || null,
      nextState.current_stage,
      nextState.current_owner_slug || null,
      nextState.current_owner_name || null,
      nextState.assigned_owner_slug || null,
      nextState.assigned_owner_name || null,
      Boolean(nextState.accepted_by_team),
      Boolean(nextState.responded_by_team),
      Boolean(nextState.returned_to_su),
      nextState.last_actor_name || null,
      nextState.last_actor_email || null,
      action,
    ]
  );

  return updatedStateResult.rows[0];
}

async function insertEvent(client, ticketId, transition, previousState, updatedState) {
  await client.query(
    `
      INSERT INTO ticket_flow_events (
        ticket_id,
        action,
        from_stage,
        to_stage,
        from_owner_slug,
        to_owner_slug,
        actor_name,
        actor_email,
        note,
        payload_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    `,
    [
      Number(ticketId),
      transition.action,
      previousState.current_stage || null,
      updatedState.current_stage,
      previousState.current_owner_slug || null,
      updatedState.current_owner_slug || null,
      transition.actor_name || null,
      transition.actor_email || null,
      transition.note || null,
      JSON.stringify(transition.payload_json || {}),
    ]
  );
}

module.exports = {
  ensureStateExists,
  insertEvent,
  updateState,
};
