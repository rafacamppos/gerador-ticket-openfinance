async function ensureStateExists(client, ticketId, transition) {
  let stateResult = await client.query(
    `
      SELECT
        ticket_id, ticket_title, ticket_status,
        requester_company_name, requester_company_key,
        current_stage, current_owner_slug, assigned_owner_slug,
        accepted_by_team, responded_by_team, returned_to_su,
        created_at, updated_at
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
      WITH inserted AS (
        INSERT INTO ticket_flow_states (
          ticket_id,
          ticket_title,
          ticket_status,
          requester_company_name,
          requester_company_key,
          current_stage,
          current_owner_slug,
          assigned_owner_slug
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      )
      SELECT
        i.*,
        towner.name AS current_owner_name,
        aowner.name AS assigned_owner_name,
        NULL::text AS last_actor_name,
        NULL::text AS last_actor_email,
        NULL::text AS last_action
      FROM inserted i
      LEFT JOIN ticket_owners towner ON towner.slug = i.current_owner_slug
      LEFT JOIN ticket_owners aowner ON aowner.slug = i.assigned_owner_slug
    `,
    [
      Number(ticketId),
      transition.initial_state.ticket_title || null,
      transition.initial_state.ticket_status || null,
      transition.initial_state.requester_company_name || null,
      transition.initial_state.requester_company_key || null,
      transition.initial_state.current_stage,
      transition.initial_state.current_owner_slug || null,
      transition.initial_state.assigned_owner_slug || null,
    ]
  );

  return insertedState.rows[0];
}

async function updateState(client, ticketId, nextState, action) {
  const updatedStateResult = await client.query(
    `
      WITH updated AS (
        UPDATE ticket_flow_states
        SET
          ticket_title = COALESCE($2, ticket_title),
          ticket_status = COALESCE($3, ticket_status),
          requester_company_name = COALESCE($4, requester_company_name),
          requester_company_key = COALESCE($5, requester_company_key),
          current_stage = $6,
          current_owner_slug = $7,
          assigned_owner_slug = $8,
          accepted_by_team = $9,
          responded_by_team = $10,
          returned_to_su = $11,
          updated_at = NOW()
        WHERE ticket_id = $1
        RETURNING *
      )
      SELECT
        u.ticket_id, u.ticket_title, u.ticket_status,
        u.requester_company_name, u.requester_company_key,
        u.current_stage, u.current_owner_slug, u.assigned_owner_slug,
        u.accepted_by_team, u.responded_by_team, u.returned_to_su,
        u.created_at, u.updated_at,
        towner.name AS current_owner_name,
        aowner.name AS assigned_owner_name,
        evt.actor_name AS last_actor_name,
        evt.actor_email AS last_actor_email,
        evt.action AS last_action
      FROM updated u
      LEFT JOIN ticket_owners towner ON towner.slug = u.current_owner_slug
      LEFT JOIN ticket_owners aowner ON aowner.slug = u.assigned_owner_slug
      LEFT JOIN LATERAL (
        SELECT actor_name, actor_email, action
        FROM ticket_flow_events
        WHERE ticket_id = u.ticket_id
        ORDER BY created_at DESC
        LIMIT 1
      ) evt ON TRUE
    `,
    [
      Number(ticketId),
      nextState.ticket_title || null,
      nextState.ticket_status || null,
      nextState.requester_company_name || null,
      nextState.requester_company_key || null,
      nextState.current_stage,
      nextState.current_owner_slug || null,
      nextState.assigned_owner_slug || null,
      Boolean(nextState.accepted_by_team),
      Boolean(nextState.responded_by_team),
      Boolean(nextState.returned_to_su),
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
