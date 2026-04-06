const test = require('node:test');
const assert = require('node:assert');

const {
  ensureStateExists,
  insertEvent,
  updateState,
} = require('../../src/repositories/ticketFlowTransitionRepository');

test('ensureStateExists returns existing state when found', async () => {
  const queries = [];
  const client = {
    async query(text, values) {
      queries.push({ text, values });
      return {
        rows: [{ ticket_id: 10, current_stage: 'routed' }],
      };
    },
  };

  const response = await ensureStateExists(client, '10', {
    initial_state: {
      current_stage: 'accepted_by_owner',
    },
  });

  assert.deepStrictEqual(response, { ticket_id: 10, current_stage: 'routed' });
  assert.strictEqual(queries.length, 1);
  assert.match(queries[0].text, /FOR UPDATE/i);
  assert.deepStrictEqual(queries[0].values, [10]);
});

test('ensureStateExists inserts initial state when none exists', async () => {
  const queries = [];
  const client = {
    async query(text, values) {
      queries.push({ text, values });
      if (queries.length === 1) {
        return { rows: [] };
      }
      return {
        rows: [{ ticket_id: 10, current_stage: 'routed' }],
      };
    },
  };

  const response = await ensureStateExists(client, '10', {
    initial_state: {
      ticket_title: 'Ticket A',
      ticket_status: 'NOVO',
      requester_company_name: 'Belvo',
      requester_company_key: 'belvo',
      current_stage: 'routed',
      current_owner_slug: 'time-a',
      assigned_owner_slug: 'time-b',
    },
  });

  assert.deepStrictEqual(response, { ticket_id: 10, current_stage: 'routed' });
  assert.strictEqual(queries.length, 2);
  assert.match(queries[1].text, /INSERT INTO ticket_flow_states/i);
  assert.deepStrictEqual(queries[1].values, [
    10,
    'Ticket A',
    'NOVO',
    'Belvo',
    'belvo',
    'routed',
    'time-a',
    'time-b',
  ]);
});

test('updateState updates normalized booleans and returns first row', async () => {
  let captured = null;
  const client = {
    async query(text, values) {
      captured = { text, values };
      return {
        rows: [{ ticket_id: 10, current_stage: 'accepted_by_owner' }],
      };
    },
  };

  const response = await updateState(client, '10', {
    ticket_title: 'Ticket A',
    ticket_status: 'EM ATENDIMENTO',
    requester_company_name: 'Belvo',
    requester_company_key: 'belvo',
    current_stage: 'accepted_by_owner',
    current_owner_slug: 'time-a',
    assigned_owner_slug: 'time-a',
    accepted_by_team: 1,
    responded_by_team: '',
    returned_to_su: null,
  });

  assert.deepStrictEqual(response, { ticket_id: 10, current_stage: 'accepted_by_owner' });
  assert.match(captured.text, /UPDATE ticket_flow_states/i);
  assert.deepStrictEqual(captured.values, [
    10,
    'Ticket A',
    'EM ATENDIMENTO',
    'Belvo',
    'belvo',
    'accepted_by_owner',
    'time-a',
    'time-a',
    true,
    false,
    false,
  ]);
});

test('insertEvent persists normalized event payload', async () => {
  let captured = null;
  const client = {
    async query(text, values) {
      captured = { text, values };
      return { rows: [] };
    },
  };

  await insertEvent(
    client,
    '10',
    {
      action: 'route_to_owner',
      actor_name: 'Rafael',
      actor_email: 'rafael@example.com',
      note: 'Encaminhado',
      payload_json: { reason: 'match' },
    },
    {
      current_stage: 'new',
      current_owner_slug: null,
    },
    {
      current_stage: 'routed',
      current_owner_slug: 'time-a',
    }
  );

  assert.match(captured.text, /INSERT INTO ticket_flow_events/i);
  assert.deepStrictEqual(captured.values, [
    10,
    'route_to_owner',
    'new',
    'routed',
    null,
    'time-a',
    'Rafael',
    'rafael@example.com',
    'Encaminhado',
    JSON.stringify({ reason: 'match' }),
  ]);
});
