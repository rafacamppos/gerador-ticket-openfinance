const test = require('node:test');
const assert = require('node:assert');

const ticketFlowService = require('../../src/services/ticketFlowService');
const { buildInitialStateSeed, buildTransition } = require('../../src/services/ticketFlowTransitions');
const { normalizeBoolean } = require('../../src/services/ticketFlowNormalization');
const ticketFlowRepository = require('../../src/repositories/ticketFlowRepository');

test('buildInitialStateSeed creates routed state when ticket is classified to an owner team', () => {
  const seed = buildInitialStateSeed({
    ticket: {
      id: '119681',
      title: 'Ticket de teste',
      status: 'NOVO',
    },
    routing: {
      owner_slug: 'consentimentos-outbound',
      owner_name: 'Consentimentos Outbound',
    },
    assignment: {
      instituicao_requerente: 'BCO SANTANDER (BRASIL) S.A.',
    },
  });

  assert.deepStrictEqual(seed, {
    ticket_id: '119681',
    ticket_title: 'Ticket de teste',
    ticket_status: 'NOVO',
    requester_company_name: 'BCO SANTANDER (BRASIL) S.A.',
    requester_company_key: 'bco_santander_brasil_s_a',
    current_stage: 'routed_to_owner',
    current_owner_slug: 'consentimentos-outbound',
    assigned_owner_slug: 'consentimentos-outbound',
    accepted_by_team: false,
    responded_by_team: false,
    returned_to_su: false,
    actor_name: null,
    actor_email: null,
  });
});

test('buildInitialStateSeed maps final statuses to consistent flow stages', () => {
  const closedSeed = buildInitialStateSeed({
    ticket: {
      id: '200',
      title: 'Ticket encerrado',
      status: 'ATENDIMENTO ENCERRADO',
    },
    routing: {
      owner_slug: 'consentimentos-outbound',
      owner_name: 'Consentimentos Outbound',
    },
  });

  const canceledSeed = buildInitialStateSeed({
    ticket: {
      id: '201',
      title: 'Ticket cancelado',
      status: 'CANCELADO',
    },
    routing: {
      owner_slug: 'su-super-usuarios',
      owner_name: 'SU (Super Usuário)',
    },
  });

  assert.strictEqual(closedSeed.current_stage, 'closed_canceled');
  assert.strictEqual(closedSeed.accepted_by_team, true);
  assert.strictEqual(closedSeed.responded_by_team, true);

  assert.strictEqual(canceledSeed.current_stage, 'closed_canceled');
  assert.strictEqual(canceledSeed.returned_to_su, true);
});

test('buildTransition moves ticket from SU to target owner', () => {
  const transition = buildTransition(null, {
    ticketId: '119681',
    action: 'route_to_owner',
    targetOwnerSlug: 'consentimentos-outbound',
    targetOwnerName: 'Consentimentos Outbound',
    actorName: 'Laura',
  });

  assert.strictEqual(transition.action, 'route_to_owner');
  assert.strictEqual(transition.next_state.current_stage, 'routed_to_owner');
  assert.strictEqual(transition.next_state.current_owner_slug, 'consentimentos-outbound');
  assert.strictEqual(transition.next_state.assigned_owner_slug, 'consentimentos-outbound');
  assert.strictEqual(transition.next_state.accepted_by_team, false);
  assert.strictEqual(transition.next_state.requester_company_name, null);
  assert.strictEqual(transition.next_state.requester_company_key, null);
});

test('buildTransition rejects SU as target owner for route_to_owner', () => {
  assert.throws(
    () =>
      buildTransition(null, {
        ticketId: '119681',
        action: 'route_to_owner',
        targetOwnerSlug: 'su-super-usuarios',
        targetOwnerName: 'SU (Super Usuário)',
        actorName: 'Laura',
      }),
    /cannot target SU/i
  );
});

test('buildTransition rejects current owner as target owner for route_to_owner', () => {
  assert.throws(
    () =>
      buildTransition(
        {
          ticket_id: '119681',
          current_stage: 'triage_su',
          current_owner_slug: 'consentimentos-outbound',
          assigned_owner_slug: 'consentimentos-outbound',
          accepted_by_team: false,
          responded_by_team: false,
          returned_to_su: false,
        },
        {
          action: 'route_to_owner',
          targetOwnerSlug: 'consentimentos-outbound',
          targetOwnerName: 'Consentimentos Outbound',
          actorName: 'Laura',
        }
      ),
    /cannot target the current owner/i
  );
});

test('buildTransition preserves requester company fields in subsequent transitions', () => {
  const transition = buildTransition(
    {
      ticket_id: '119681',
      ticket_title: 'Ticket de teste',
      ticket_status: 'NOVO',
      requester_company_name: 'Belvo',
      requester_company_key: 'belvo',
      current_stage: 'routed_to_owner',
      current_owner_slug: 'consentimentos-outbound',

      assigned_owner_slug: 'consentimentos-outbound',

      accepted_by_team: false,
      responded_by_team: false,
      returned_to_su: false,
    },
    {
      action: 'accept',
      actorName: 'Angela',
    }
  );

  assert.strictEqual(transition.next_state.requester_company_name, 'Belvo');
  assert.strictEqual(transition.next_state.requester_company_key, 'belvo');
});

test('buildTransition accepts ticket inside the owner queue', () => {
  const transition = buildTransition(
    {
      ticket_id: '119681',
      current_stage: 'routed_to_owner',
      current_owner_slug: 'consentimentos-outbound',

      assigned_owner_slug: 'consentimentos-outbound',

      accepted_by_team: false,
      responded_by_team: false,
      returned_to_su: false,
    },
    {
      action: 'accept',
      actorName: 'Angela',
    }
  );

  assert.strictEqual(transition.next_state.current_stage, 'accepted_by_owner');
  assert.strictEqual(transition.next_state.accepted_by_team, true);
  assert.strictEqual(transition.next_state.current_owner_slug, 'consentimentos-outbound');
});

test('buildTransition returns ticket to SU when team rejects or sends back', () => {
  const transition = buildTransition(
    {
      ticket_id: '119681',
      current_stage: 'accepted_by_owner',
      current_owner_slug: 'consentimentos-outbound',

      assigned_owner_slug: 'consentimentos-outbound',

      accepted_by_team: true,
      responded_by_team: false,
      returned_to_su: false,
    },
    {
      action: 'return_to_su',
      actorName: 'Angela',
    }
  );

  assert.strictEqual(transition.next_state.current_stage, 'returned_to_su');
  assert.strictEqual(transition.next_state.current_owner_slug, 'su-super-usuarios');
  assert.strictEqual(transition.next_state.returned_to_su, true);
  assert.strictEqual(transition.next_state.accepted_by_team, false);
});

test('buildTransition marks ticket as responded by owner', () => {
  const transition = buildTransition(
    {
      ticket_id: '119681',
      current_stage: 'accepted_by_owner',
      current_owner_slug: 'consentimentos-outbound',

      assigned_owner_slug: 'consentimentos-outbound',

      accepted_by_team: true,
      responded_by_team: false,
      returned_to_su: false,
    },
    {
      action: 'respond',
      actorName: 'Angela',
    }
  );

  assert.strictEqual(transition.next_state.current_stage, 'responded_by_owner');
  assert.strictEqual(transition.next_state.responded_by_team, true);
});

test('syncTicketFlows persists immutable closed statuses only when they do not exist yet', async () => {
  const originalUpsertInitialStates = ticketFlowRepository.upsertInitialStates;
  const originalGetStatesByTicketIds = ticketFlowRepository.getStatesByTicketIds;
  let capturedStates = null;

  ticketFlowRepository.getStatesByTicketIds = async () => [
    {
      ticket_id: '2',
      ticket_status: 'ATENDIMENTO ENCERRADO',
    },
  ];

  ticketFlowRepository.upsertInitialStates = async (states) => {
    capturedStates = states;
    return states;
  };

  try {
    const response = await ticketFlowService.syncTicketFlows([
      {
        ticket: {
          id: '1',
          title: 'Ticket cancelado',
          status: 'CANCELADO',
        },
        routing: {
          owner_slug: 'consentimentos-outbound',
          owner_name: 'Consentimentos Outbound',
        },
      },
      {
        ticket: {
          id: '2',
          title: 'Ticket encerrado',
          status: 'ATENDIMENTO ENCERRADO',
        },
        routing: {
          owner_slug: 'consentimentos-outbound',
          owner_name: 'Consentimentos Outbound',
        },
      },
      {
        ticket: {
          id: '3',
          title: 'Ticket ativo',
          status: 'NOVO',
        },
        routing: {
          owner_slug: 'consentimentos-outbound',
          owner_name: 'Consentimentos Outbound',
        },
      },
    ]);

    assert.strictEqual(response.length, 2);
    assert.strictEqual(capturedStates.length, 2);
    assert.deepStrictEqual(
      capturedStates.map((state) => state.ticket_id),
      ['1', '3']
    );
    assert.deepStrictEqual(
      capturedStates.map((state) => state.ticket_status),
      ['CANCELADO', 'NOVO']
    );
  } finally {
    ticketFlowRepository.upsertInitialStates = originalUpsertInitialStates;
    ticketFlowRepository.getStatesByTicketIds = originalGetStatesByTicketIds;
  }
});

test('syncTicketFlows returns empty array when there are no seed states', async () => {
  const response = await ticketFlowService.syncTicketFlows([
    {
      ticket: {},
      routing: null,
    },
  ]);

  assert.deepStrictEqual(response, []);
});

test('syncTicketFlows returns empty array when repository throws', async () => {
  const originalGetStatesByTicketIds = ticketFlowRepository.getStatesByTicketIds;
  ticketFlowRepository.getStatesByTicketIds = async () => {
    throw new Error('db unavailable');
  };

  try {
    const response = await ticketFlowService.syncTicketFlows([
      {
        ticket: {
          id: '1',
          title: 'Ticket ativo',
          status: 'NOVO',
        },
        routing: {
          owner_slug: 'consentimentos-outbound',
          owner_name: 'Consentimentos Outbound',
        },
      },
    ]);

    assert.deepStrictEqual(response, []);
  } finally {
    ticketFlowRepository.getStatesByTicketIds = originalGetStatesByTicketIds;
  }
});

test('attachFlowStates enriches tickets with normalized flow state', async () => {
  const originalGetStatesByTicketIds = ticketFlowRepository.getStatesByTicketIds;
  ticketFlowRepository.getStatesByTicketIds = async () => [
    {
      ticket_id: 10,
      ticket_title: 'Ticket A',
      ticket_status: 'NOVO',
      requester_company_name: 'Belvo',
      requester_company_key: 'belvo',
      current_stage: 'routed_to_owner',
      current_owner_slug: 'time-a',
      current_owner_name: 'Time A',
      assigned_owner_slug: 'time-a',
      assigned_owner_name: 'Time A',
      accepted_by_team: false,
      responded_by_team: false,
      returned_to_su: false,
      last_actor_name: 'Rafael',
      last_actor_email: 'rafael@example.com',
      last_action: 'route_to_owner',
      updated_at: '2026-03-29T10:20:00.000Z',
    },
  ];

  try {
    const response = await ticketFlowService.attachFlowStates([
      { ticket: { id: '10' } },
      { ticket: { id: '20' } },
    ]);

    assert.strictEqual(response[0].flow.ticket_id, '10');
    assert.strictEqual(response[0].flow.current_owner_name, 'Time A');
    assert.strictEqual(response[1].flow, null);
  } finally {
    ticketFlowRepository.getStatesByTicketIds = originalGetStatesByTicketIds;
  }
});

test('attachFlowStates returns original tickets when repository throws', async () => {
  const originalGetStatesByTicketIds = ticketFlowRepository.getStatesByTicketIds;
  const tickets = [{ ticket: { id: '10' } }];
  ticketFlowRepository.getStatesByTicketIds = async () => {
    throw new Error('db unavailable');
  };

  try {
    const response = await ticketFlowService.attachFlowStates(tickets);
    assert.strictEqual(response, tickets);
  } finally {
    ticketFlowRepository.getStatesByTicketIds = originalGetStatesByTicketIds;
  }
});

test('getTicketFlow returns normalized state and events', async () => {
  const originalGetStateByTicketId = ticketFlowRepository.getStateByTicketId;
  const originalListEventsByTicketId = ticketFlowRepository.listEventsByTicketId;

  ticketFlowRepository.getStateByTicketId = async () => ({
    ticket_id: 10,
    ticket_title: 'Ticket A',
    ticket_status: 'NOVO',
    requester_company_name: 'Belvo',
    requester_company_key: 'belvo',
    current_stage: 'routed_to_owner',
    current_owner_slug: 'time-a',
    current_owner_name: 'Time A',
    assigned_owner_slug: 'time-a',
    assigned_owner_name: 'Time A',
    accepted_by_team: false,
    responded_by_team: false,
    returned_to_su: false,
  });
  ticketFlowRepository.listEventsByTicketId = async () => [
    {
      id: 1,
      ticket_id: 10,
      action: 'route_to_owner',
      from_stage: 'triage_su',
      to_stage: 'routed_to_owner',
      from_owner_slug: 'su-super-usuarios',
      to_owner_slug: 'time-a',
      actor_name: 'Rafael',
      actor_email: 'rafael@example.com',
      note: 'Encaminhado',
      payload_json: { reason: 'match' },
      created_at: '2026-03-29T10:20:00.000Z',
    },
  ];

  try {
    const response = await ticketFlowService.getTicketFlow('10');
    assert.strictEqual(response.state.ticket_id, '10');
    assert.strictEqual(response.events[0].id, 1);
    assert.strictEqual(response.events[0].action, 'route_to_owner');
  } finally {
    ticketFlowRepository.getStateByTicketId = originalGetStateByTicketId;
    ticketFlowRepository.listEventsByTicketId = originalListEventsByTicketId;
  }
});

test('listTicketFlows normalizes query filters and rows', async () => {
  const originalListStates = ticketFlowRepository.listStates;
  let captured = null;
  ticketFlowRepository.listStates = async (filters) => {
    captured = filters;
    return [
      {
        ticket_id: 10,
        current_stage: 'routed_to_owner',
        current_owner_slug: 'time-a',
      },
    ];
  };

  try {
    const response = await ticketFlowService.listTicketFlows({
      currentOwnerSlug: 'time-a',
      acceptedByTeam: 'sim',
      responded_by_team: 'nao',
      returned_to_su: 'desconhecido',
    });

    assert.deepStrictEqual(captured, {
      current_owner_slug: 'time-a',
      current_stage: null,
      accepted_by_team: true,
      responded_by_team: false,
      returned_to_su: null,
    });
    assert.strictEqual(response[0].ticket_id, '10');
  } finally {
    ticketFlowRepository.listStates = originalListStates;
  }
});

test('transitionTicketFlow builds transition from current state and returns normalized result', async () => {
  const originalGetStateByTicketId = ticketFlowRepository.getStateByTicketId;
  const originalTransitionState = ticketFlowRepository.transitionState;
  const originalListEventsByTicketId = ticketFlowRepository.listEventsByTicketId;

  ticketFlowRepository.getStateByTicketId = async () => ({
    ticket_id: 10,
    current_stage: 'routed_to_owner',
    current_owner_slug: 'time-a',
    assigned_owner_slug: 'time-a',
    accepted_by_team: false,
    responded_by_team: false,
    returned_to_su: false,
  });
  ticketFlowRepository.transitionState = async () => ({
    ticket_id: 10,
    current_stage: 'accepted_by_owner',
    current_owner_slug: 'time-a',
    assigned_owner_slug: 'time-a',
    accepted_by_team: true,
    responded_by_team: false,
    returned_to_su: false,
  });
  ticketFlowRepository.listEventsByTicketId = async () => [
    {
      id: 1,
      ticket_id: 10,
      action: 'accept',
      from_stage: 'routed_to_owner',
      to_stage: 'accepted_by_owner',
      created_at: '2026-03-29T10:20:00.000Z',
    },
  ];

  try {
    const response = await ticketFlowService.transitionTicketFlow('10', {
      action: 'accept',
      actorName: 'Rafael',
    });

    assert.strictEqual(response.state.current_stage, 'accepted_by_owner');
    assert.strictEqual(response.events[0].action, 'accept');
  } finally {
    ticketFlowRepository.getStateByTicketId = originalGetStateByTicketId;
    ticketFlowRepository.transitionState = originalTransitionState;
    ticketFlowRepository.listEventsByTicketId = originalListEventsByTicketId;
  }
});

// --- buildInitialStateSeed branches ---

test('buildInitialStateSeed returns null when ticket has no id', () => {
  assert.strictEqual(buildInitialStateSeed({ ticket: {}, routing: null }), null);
});

test('buildInitialStateSeed sets closed_canceled stage and respondedByTeam for ATENDIMENTO ENCERRADO', () => {
  const seed = buildInitialStateSeed({
    ticket: { id: '1', status: 'ATENDIMENTO ENCERRADO', title: 'Encerrado' },
    routing: null,
  });
  assert.strictEqual(seed.current_stage, 'closed_canceled');
  assert.strictEqual(seed.accepted_by_team, true);
  assert.strictEqual(seed.responded_by_team, true);
});

test('buildInitialStateSeed sets closed_canceled stage and returnedToSu for CANCELADO', () => {
  const seed = buildInitialStateSeed({
    ticket: { id: '2', status: 'CANCELADO', title: 'Cancelado' },
    routing: null,
  });
  assert.strictEqual(seed.current_stage, 'closed_canceled');
  assert.strictEqual(seed.returned_to_su, true);
});

test('buildInitialStateSeed sets triage_su when routing targets SU owner', () => {
  const seed = buildInitialStateSeed({
    ticket: { id: '3', status: 'NOVO' },
    routing: { owner_slug: 'su-super-usuarios', owner_name: 'SU (Super Usuário)' },
  });
  assert.strictEqual(seed.current_stage, 'triage_su');
  assert.strictEqual(seed.assigned_owner_slug, null);
});

// --- buildTransition branches ---

test('buildTransition throws when action is missing', () => {
  assert.throws(
    () => buildTransition({}, { action: '' }),
    /action.*required/i
  );
});

test('buildTransition throws when route_to_owner is missing targetOwnerSlug', () => {
  assert.throws(
    () => buildTransition({}, { action: 'route_to_owner', targetOwnerSlug: '', targetOwnerName: '' }),
    /targetOwnerSlug.*targetOwnerName/i
  );
});

test('buildTransition throws when route_to_owner targets SU', () => {
  const state = { current_stage: 'triage_su', current_owner_slug: 'su-super-usuarios' };
  assert.throws(
    () => buildTransition(state, { action: 'route_to_owner', targetOwnerSlug: 'su-super-usuarios', targetOwnerName: 'SU (Super Usuário)' }),
    /cannot target SU/i
  );
});

test('buildTransition throws when route_to_owner targets current owner', () => {
  const state = { current_stage: 'routed_to_owner', current_owner_slug: 'consentimentos-outbound' };
  assert.throws(
    () => buildTransition(state, { action: 'route_to_owner', targetOwnerSlug: 'consentimentos-outbound', targetOwnerName: 'Consentimentos Outbound' }),
    /cannot target the current owner/i
  );
});

test('buildTransition throws for unsupported action', () => {
  const state = { current_stage: 'triage_su', current_owner_slug: 'su-super-usuarios' };
  assert.throws(
    () => buildTransition(state, { action: 'acao_invalida' }),
    /Unsupported ticket flow action/i
  );
});

test('buildTransition builds state from payload when currentState is null', () => {
  const result = buildTransition(null, {
    action: 'accept',
    ticketId: '99',
    ticketTitle: 'Ticket Sem Estado',
    ticketStatus: 'NOVO',
    requesterCompanyName: 'Banco XYZ',
  });
  assert.strictEqual(result.next_state.current_stage, 'accepted_by_owner');
  assert.strictEqual(result.initial_state.ticket_id, '99');
  assert.strictEqual(result.initial_state.requester_company_key, 'banco_xyz');
});

// --- normalizeBoolean branches ---

test('normalizeBoolean returns boolean as-is', () => {
  assert.strictEqual(normalizeBoolean(true), true);
  assert.strictEqual(normalizeBoolean(false), false);
});

test('normalizeBoolean converts number: 0 -> false, non-zero -> true', () => {
  assert.strictEqual(normalizeBoolean(0), false);
  assert.strictEqual(normalizeBoolean(1), true);
  assert.strictEqual(normalizeBoolean(42), true);
});

test('normalizeBoolean returns null for empty string', () => {
  assert.strictEqual(normalizeBoolean(''), null);
  assert.strictEqual(normalizeBoolean(null), null);
});

test('normalizeBoolean returns null for unrecognized string', () => {
  assert.strictEqual(normalizeBoolean('maybe'), null);
});

// --- syncTicketFlows: statesToPersist empty (all immutable and existing) ---

test('syncTicketFlows returns empty when all states are immutable and already exist', async () => {
  const originalGetStatesByTicketIds = ticketFlowRepository.getStatesByTicketIds;
  const originalUpsertInitialStates = ticketFlowRepository.upsertInitialStates;

  ticketFlowRepository.getStatesByTicketIds = async () => [{ ticket_id: '5' }];
  ticketFlowRepository.upsertInitialStates = async () => { throw new Error('should not be called'); };

  try {
    const result = await ticketFlowService.syncTicketFlows([
      {
        ticket: { id: '5', status: 'CANCELADO' },
        routing: null,
      },
    ]);
    assert.deepStrictEqual(result, []);
  } finally {
    ticketFlowRepository.getStatesByTicketIds = originalGetStatesByTicketIds;
    ticketFlowRepository.upsertInitialStates = originalUpsertInitialStates;
  }
});
