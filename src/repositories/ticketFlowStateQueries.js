function buildUpsertInitialStatesQuery(states = []) {
  const values = [];
  const placeholders = states.map((state, index) => {
    const offset = index * 11;
    values.push(
      Number(state.ticket_id),
      state.ticket_title || null,
      state.ticket_status || null,
      state.requester_company_name || null,
      state.requester_company_key || null,
      state.current_stage,
      state.current_owner_slug || null,
      state.assigned_owner_slug || null,
      Boolean(state.accepted_by_team),
      Boolean(state.responded_by_team),
      Boolean(state.returned_to_su)
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`;
  });

  return {
    text: `
      INSERT INTO ticket_flow_states (
        ticket_id,
        ticket_title,
        ticket_status,
        requester_company_name,
        requester_company_key,
        current_stage,
        current_owner_slug,
        assigned_owner_slug,
        accepted_by_team,
        responded_by_team,
        returned_to_su
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (ticket_id) DO UPDATE
      SET
        ticket_title = EXCLUDED.ticket_title,
        ticket_status = EXCLUDED.ticket_status,
        requester_company_name = EXCLUDED.requester_company_name,
        requester_company_key = EXCLUDED.requester_company_key,
        assigned_owner_slug = COALESCE(ticket_flow_states.assigned_owner_slug, EXCLUDED.assigned_owner_slug),
        updated_at = NOW()
      RETURNING *
    `,
    values,
  };
}

function buildListStatesQuery(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.current_owner_slug) {
    values.push(filters.current_owner_slug);
    conditions.push(`tfs.current_owner_slug = $${values.length}`);
  }

  if (filters.current_stage) {
    values.push(filters.current_stage);
    conditions.push(`tfs.current_stage = $${values.length}`);
  }

  if (filters.accepted_by_team !== undefined && filters.accepted_by_team !== null) {
    values.push(filters.accepted_by_team);
    conditions.push(`tfs.accepted_by_team = $${values.length}`);
  }

  if (filters.responded_by_team !== undefined && filters.responded_by_team !== null) {
    values.push(filters.responded_by_team);
    conditions.push(`tfs.responded_by_team = $${values.length}`);
  }

  if (filters.returned_to_su !== undefined && filters.returned_to_su !== null) {
    values.push(filters.returned_to_su);
    conditions.push(`tfs.returned_to_su = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    text: `
      SELECT
        tfs.ticket_id,
        tfs.ticket_title,
        tfs.ticket_status,
        tfs.requester_company_name,
        tfs.requester_company_key,
        tfs.current_stage,
        tfs.current_owner_slug,
        tfs.assigned_owner_slug,
        tfs.accepted_by_team,
        tfs.responded_by_team,
        tfs.returned_to_su,
        tfs.created_at,
        tfs.updated_at,
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
      ${whereClause}
      ORDER BY tfs.updated_at DESC, tfs.ticket_id DESC
    `,
    values,
  };
}

module.exports = {
  buildListStatesQuery,
  buildUpsertInitialStatesQuery,
};
