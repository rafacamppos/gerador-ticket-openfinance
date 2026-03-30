const {
  getTicketFlowStageLabel,
  getTicketFlowActionLabel,
} = require('../contracts/ticketFlowContract');

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (['true', '1', 'sim', 'yes'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'nao', 'não', 'no'].includes(normalized)) {
    return false;
  }

  return null;
}

function normalizeRequesterCompanyKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || null;
}

function normalizeStateRow(row = {}) {
  return {
    ticket_id: row.ticket_id ? String(row.ticket_id) : null,
    ticket_title: row.ticket_title || null,
    ticket_status: row.ticket_status || null,
    requester_company_name: row.requester_company_name || null,
    requester_company_key: row.requester_company_key || null,
    current_stage: row.current_stage || null,
    current_stage_label: getTicketFlowStageLabel(row.current_stage || null),
    current_owner_slug: row.current_owner_slug || null,
    current_owner_name: row.current_owner_name || null,
    assigned_owner_slug: row.assigned_owner_slug || null,
    assigned_owner_name: row.assigned_owner_name || null,
    accepted_by_team: Boolean(row.accepted_by_team),
    responded_by_team: Boolean(row.responded_by_team),
    returned_to_su: Boolean(row.returned_to_su),
    last_actor_name: row.last_actor_name || null,
    last_actor_email: row.last_actor_email || null,
    last_action: row.last_action || null,
    last_action_label: getTicketFlowActionLabel(row.last_action || null),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

function normalizeEventRow(row = {}) {
  return {
    id: row.id ?? null,
    ticket_id: row.ticket_id ? String(row.ticket_id) : null,
    action: row.action || null,
    action_label: getTicketFlowActionLabel(row.action || null),
    from_stage: row.from_stage || null,
    from_stage_label: getTicketFlowStageLabel(row.from_stage || null),
    to_stage: row.to_stage || null,
    to_stage_label: getTicketFlowStageLabel(row.to_stage || null),
    from_owner_slug: row.from_owner_slug || null,
    to_owner_slug: row.to_owner_slug || null,
    actor_name: row.actor_name || null,
    actor_email: row.actor_email || null,
    note: row.note || null,
    payload_json: row.payload_json || {},
    created_at: row.created_at || null,
  };
}

module.exports = {
  normalizeBoolean,
  normalizeEventRow,
  normalizeRequesterCompanyKey,
  normalizeStateRow,
};
