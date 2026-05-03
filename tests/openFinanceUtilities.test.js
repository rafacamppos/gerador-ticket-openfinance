const test = require('node:test');
const assert = require('node:assert');

const {
  ensureTicketCreationPayload,
  ensureTicketUpdatePayload,
  ensureActivityPayload,
} = require('../src/services/openFinanceTicketPayloads');
const {
  normalizeTicketCreationQuery,
  normalizeTicketListQuery,
  resolveOwnerSlugFilter,
  resolveTicketListOwner,
  resolveTicketStatusFilter,
  shouldHideFromOperationalQueue,
} = require('../src/services/openFinanceTicketQuery');
const {
  normalizeEndpoint,
  normalizeJsonPayload,
  normalizeHttpMethod,
  normalizeHttpStatusCode,
  normalizeRelatedTicketId,
  normalizeTeamSlug,
  normalizeTimestamp,
  normalizeUuid,
} = require('../src/services/applicationIncidentValidation');
const {
  getDefaultEnvironment,
  listAvailableEnvironments,
  resolveEnvironment,
} = require('../src/services/openFinanceEnvironmentService');
const { normalizeIncidentRow } = require('../src/services/applicationIncidentMapper');
const {
  normalizeBoolean,
  normalizeRequesterCompanyKey,
  normalizeStateRow,
  normalizeEventRow,
} = require('../src/services/ticketFlowNormalization');
const {
  getIncidentStatusLabel,
} = require('../src/contracts/applicationIncidentContract');
const {
  getTicketFlowActionLabel,
  getTicketFlowStageLabel,
} = require('../src/contracts/ticketFlowContract');

test('ticket payload validators enforce required structures', () => {
  assert.deepStrictEqual(ensureTicketCreationPayload({ info: [{ key: 'a', value: 'b' }] }), {
    info: [{ key: 'a', value: 'b' }],
  });

  assert.deepStrictEqual(ensureTicketUpdatePayload('123', { info: [{ key: 'x' }] }), {
    id: '123',
    info: [{ key: 'x' }],
  });

  assert.deepStrictEqual(
    ensureActivityPayload('321', {
      userId: '8',
      fromTime: '2026-03-30T10:00:00Z',
      toTime: '2026-03-30T11:00:00Z',
      description: 'Atendimento realizado',
    }),
    {
      id: '321',
      userId: '8',
      fromTime: '2026-03-30T10:00:00Z',
      toTime: '2026-03-30T11:00:00Z',
      description: 'Atendimento realizado',
    }
  );

  assert.throws(() => ensureTicketCreationPayload({ info: [] }), /info/i);
  assert.throws(() => ensureTicketUpdatePayload('123', {}), /info/i);
  assert.throws(() => ensureActivityPayload('321', {}), /userId/i);
});

test('ticket query helpers normalize filters and operational visibility', () => {
  assert.deepStrictEqual(
    normalizeTicketListQuery({
      assignedGroup: '10',
      problem_type: 'Erro API',
    }),
    {
      assigned_group: '10',
      problem_type: 'Erro API',
    }
  );

  assert.deepStrictEqual(normalizeTicketCreationQuery({ template: '20' }), {
    type: '1',
    template: '20',
  });

  assert.strictEqual(resolveTicketStatusFilter({ status_id: '30' }), 'CANCELADO');
  assert.strictEqual(resolveTicketStatusFilter({ status: 'TODOS' }), null);
  assert.strictEqual(resolveOwnerSlugFilter({ owner_slug: 'time-a' }), 'time-a');
  assert.strictEqual(
    resolveTicketListOwner({
      flow: { current_owner_slug: 'time-fluxo' },
      routing: { owner_slug: 'time-classificacao' },
    }),
    'time-fluxo'
  );

  assert.strictEqual(
    shouldHideFromOperationalQueue({ ticket: { status: 'ATENDIMENTO ENCERRADO' } }),
    true
  );
  assert.strictEqual(
    shouldHideFromOperationalQueue({ flow: { ticket_status: 'EM ATENDIMENTO N2' } }),
    false
  );
});

test('application incident validation normalizes accepted values and rejects invalid inputs', () => {
  assert.strictEqual(
    normalizeUuid('7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3', 'x_fapi_interaction_id'),
    '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3'
  );
  assert.strictEqual(normalizeTeamSlug('consentimentos-inbound'), 'consentimentos-inbound');
  assert.strictEqual(normalizeEndpoint('/open-banking/consents/v3/consents'), '/open-banking/consents/v3/consents');
  assert.strictEqual(normalizeHttpMethod('post'), 'POST');
  assert.strictEqual(normalizeHttpStatusCode('429'), 429);
  assert.strictEqual(normalizeRelatedTicketId('12345'), 12345);
  assert.strictEqual(normalizeRelatedTicketId('', { required: false }), null);
  assert.strictEqual(normalizeTimestamp('2026-03-30T12:00:00.000Z'), '2026-03-30T12:00:00.000Z');
  assert.strictEqual(normalizeTimestamp('2026-03-30T09:00:00'), '2026-03-30T09:00:00');
  assert.deepStrictEqual(normalizeJsonPayload([{ code: '500' }], 'payload_request'), [{ code: '500' }]);

  assert.throws(() => normalizeUuid('invalid', 'field'), /valid UUID/i);
  assert.throws(() => normalizeTeamSlug(''), /teamSlug/i);
  assert.throws(() => normalizeEndpoint(''), /endpoint/i);
  assert.throws(() => normalizeHttpMethod('trace'), /valid HTTP method/i);
  assert.throws(() => normalizeHttpStatusCode(99), /between 100 and 599/i);
  assert.throws(() => normalizeRelatedTicketId('', { required: true }), /related_ticket_id/i);
  assert.throws(() => normalizeTimestamp('not-a-date'), /valid timestamp/i);
  assert.throws(() => normalizeJsonPayload(null, 'payload_request'), /payload_request/i);
});

test('environment service resolves by key label and base url', () => {
  const available = listAvailableEnvironments();

  assert.strictEqual(Array.isArray(available), true);
  assert.strictEqual(available.length >= 2, true);
  assert.deepStrictEqual(resolveEnvironment('production'), available[0]);
  assert.deepStrictEqual(resolveEnvironment('HOMOLOGACAO'), available[1]);
  assert.deepStrictEqual(
    resolveEnvironment('https://servicedesksandbox.openfinancebrasil.org.br'),
    available[0]
  );
  assert.strictEqual(getDefaultEnvironment().key.length > 0, true);
  assert.strictEqual(resolveEnvironment(''), null);
});

test('incident mapper and contracts expose normalized labels', () => {
  assert.strictEqual(getIncidentStatusLabel('new'), 'Novo');
  assert.strictEqual(getIncidentStatusLabel('desconhecido'), 'desconhecido');

  assert.deepStrictEqual(
    normalizeIncidentRow({
      id: 10,
      team_slug: 'consentimentos-inbound',
      team_name: 'Consentimentos Inbound',
      title: 'Falha no consentimento',
      payload_request: { consentId: 'urn:abc' },
      payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
      occurred_at: '2026-03-30T10:00:00.000Z',
      http_status_code: 500,
      description: 'Erro ao criar consentimento',
      tipo_cliente: 'PF',
      canal_jornada: 'App to app',
      incident_status: 'assigned',
      related_ticket_id: 999,
      assigned_to_user_id: 8,
    }),
    {
      id: '10',
      team_slug: 'consentimentos-inbound',
      team_name: 'Consentimentos Inbound',
      title: 'Falha no consentimento',
      x_fapi_interaction_id: null,
      authorization_server: null,
      client_id: null,
      endpoint: null,
      method: null,
      payload_request: { consentId: 'urn:abc' },
      payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
      occurred_at: '2026-03-30T10:00:00.000Z',
      http_status_code: 500,
      description: 'Erro ao criar consentimento',
      tipo_cliente: 'PF',
      canal_jornada: 'App to app',
      id_version_api: null,
      category_data: null,
      ticket_context: null,
      incident_status: 'assigned',
      incident_status_label: 'Atribuido',
      related_ticket_id: '999',
      assigned_to_user_id: '8',
      assigned_to_name: null,
      assigned_to_email: null,
      created_at: null,
      updated_at: null,
    }
  );
});

test('ticket flow normalization and contracts derive labels and booleans', () => {
  assert.strictEqual(normalizeBoolean('sim'), true);
  assert.strictEqual(normalizeBoolean('não'), false);
  assert.strictEqual(normalizeBoolean('desconhecido'), null);
  assert.strictEqual(normalizeRequesterCompanyKey('BCO SANTANDER (BRASIL) S.A.'), 'bco_santander_brasil_s_a');
  assert.strictEqual(getTicketFlowStageLabel('accepted_by_owner'), 'Aceito pela equipe');
  assert.strictEqual(getTicketFlowStageLabel('missing'), 'Fluxo pendente');
  assert.strictEqual(getTicketFlowActionLabel('respond'), 'Resposta');
  assert.strictEqual(getTicketFlowActionLabel('missing'), 'Atualização');

  assert.deepStrictEqual(
    normalizeStateRow({
      ticket_id: 22,
      ticket_title: 'Teste',
      ticket_status: 'NOVO',
      requester_company_name: 'Belvo',
      requester_company_key: 'belvo',
      current_stage: 'accepted_by_owner',
      current_owner_slug: 'time-a',
      current_owner_name: 'Time A',
      assigned_owner_slug: 'time-a',
      assigned_owner_name: 'Time A',
      accepted_by_team: 1,
      responded_by_team: 0,
      returned_to_su: false,
      last_actor_name: 'Analista',
      last_actor_email: 'analista@empresa.com',
      last_action: 'accept',
      created_at: '2026-03-30T10:00:00.000Z',
      updated_at: '2026-03-30T11:00:00.000Z',
    }).current_stage_label,
    'Aceito pela equipe'
  );

  assert.deepStrictEqual(
    normalizeEventRow({
      id: 1,
      ticket_id: 22,
      action: 'respond',
      from_stage: 'accepted_by_owner',
      to_stage: 'responded_by_owner',
      from_owner_slug: 'time-a',
      to_owner_slug: 'time-a',
      actor_name: 'Analista',
      actor_email: 'analista@empresa.com',
      note: 'Respondido',
      payload_json: { action: 'respond' },
      created_at: '2026-03-30T12:00:00.000Z',
    }).action_label,
    'Resposta'
  );
});
