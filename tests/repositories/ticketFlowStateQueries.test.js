const test = require('node:test');
const assert = require('node:assert');

const {
  buildListStatesQuery,
  buildUpsertInitialStatesQuery,
} = require('../../src/repositories/ticketFlowStateQueries');

test('buildUpsertInitialStatesQuery builds placeholders and normalized values', () => {
  const query = buildUpsertInitialStatesQuery([
    {
      ticket_id: '10',
      ticket_title: 'Ticket A',
      ticket_status: 'NOVO',
      requester_company_name: 'Belvo',
      requester_company_key: 'belvo',
      current_stage: 'routed',
      current_owner_slug: 'time-a',
      assigned_owner_slug: 'time-a',
      accepted_by_team: '1',
      responded_by_team: 0,
      returned_to_su: null,
    },
    {
      ticket_id: 20,
      current_stage: 'accepted_by_owner',
    },
  ]);

  assert.match(query.text, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11\), \(\$12, \$13, \$14, \$15, \$16, \$17, \$18, \$19, \$20, \$21, \$22\)/);
  assert.match(query.text, /ON CONFLICT \(ticket_id\) DO UPDATE/i);
  assert.deepStrictEqual(query.values, [
    10, 'Ticket A', 'NOVO', 'Belvo', 'belvo', 'routed', 'time-a', 'time-a', true, false, false,
    20, null, null, null, null, 'accepted_by_owner', null, null, false, false, false,
  ]);
});

test('buildListStatesQuery includes all provided filters in order', () => {
  const query = buildListStatesQuery({
    current_owner_slug: 'time-a',
    current_stage: 'routed',
    accepted_by_team: true,
    responded_by_team: false,
    returned_to_su: true,
  });

  assert.match(query.text, /WHERE tfs\.current_owner_slug = \$1 AND tfs\.current_stage = \$2 AND tfs\.accepted_by_team = \$3 AND tfs\.responded_by_team = \$4 AND tfs\.returned_to_su = \$5/i);
  assert.deepStrictEqual(query.values, ['time-a', 'routed', true, false, true]);
});

test('buildListStatesQuery omits where clause when no filters are provided', () => {
  const query = buildListStatesQuery();

  assert.doesNotMatch(query.text, /WHERE tfs\.current_owner_slug/);
  assert.doesNotMatch(query.text, /WHERE tfs\.current_stage/);
  assert.deepStrictEqual(query.values, []);
});
