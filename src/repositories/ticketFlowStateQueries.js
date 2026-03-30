function buildUpsertInitialStatesQuery(states = []) {
  const values = [];
  const placeholders = states.map((state, index) => {
    const offset = index * 14;
    values.push(
      Number(state.ticket_id),
      state.ticket_title || null,
      state.ticket_status || null,
      state.requester_company_name || null,
      state.requester_company_key || null,
      state.current_stage,
      state.current_owner_slug || null,
      state.current_owner_name || null,
      state.assigned_owner_slug || null,
      state.assigned_owner_name || null,
      Boolean(state.accepted_by_team),
      Boolean(state.responded_by_team),
      Boolean(state.returned_to_su),
      state.last_action || null
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`;
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
        current_owner_name,
        assigned_owner_slug,
        assigned_owner_name,
        accepted_by_team,
        responded_by_team,
        returned_to_su,
        last_action
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (ticket_id) DO UPDATE
      SET
        ticket_title = EXCLUDED.ticket_title,
        ticket_status = EXCLUDED.ticket_status,
        requester_company_name = EXCLUDED.requester_company_name,
        requester_company_key = EXCLUDED.requester_company_key,
        assigned_owner_slug = COALESCE(ticket_flow_states.assigned_owner_slug, EXCLUDED.assigned_owner_slug),
        assigned_owner_name = COALESCE(ticket_flow_states.assigned_owner_name, EXCLUDED.assigned_owner_name),
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
    conditions.push(`current_owner_slug = $${values.length}`);
  }

  if (filters.current_stage) {
    values.push(filters.current_stage);
    conditions.push(`current_stage = $${values.length}`);
  }

  if (filters.accepted_by_team !== undefined && filters.accepted_by_team !== null) {
    values.push(filters.accepted_by_team);
    conditions.push(`accepted_by_team = $${values.length}`);
  }

  if (filters.responded_by_team !== undefined && filters.responded_by_team !== null) {
    values.push(filters.responded_by_team);
    conditions.push(`responded_by_team = $${values.length}`);
  }

  if (filters.returned_to_su !== undefined && filters.returned_to_su !== null) {
    values.push(filters.returned_to_su);
    conditions.push(`returned_to_su = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    text: `
      SELECT *
      FROM ticket_flow_states
      ${whereClause}
      ORDER BY updated_at DESC, ticket_id DESC
    `,
    values,
  };
}

module.exports = {
  buildListStatesQuery,
  buildUpsertInitialStatesQuery,
};
