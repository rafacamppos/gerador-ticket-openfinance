const test = require('node:test');
const assert = require('node:assert');

const {
  buildRoutingContext,
  classifyTicketWithRules,
} = require('../../src/services/ticketOwnerClassificationService');

test('buildRoutingContext flattens formatted ticket fields used in routing', () => {
  const context = buildRoutingContext({
    ticket: {
      id: '177888',
      title: 'Teste',
      status: 'EM ATENDIMENTO N2',
      type: '1',
      sr_type: 'Incidente',
      template: '20',
      category: {
        nivel1: 'Erro na Jornada ou Dados',
        nivel2: 'Trabalhando os Dados',
        nivel3: 'Tipo F V3',
      },
    },
    assignment: {
      grupo: 'N2_Santander',
      solicitante: 'Open Finance Santander',
      responsavel: 'Analista',
      nivel_suporte_atual: '2',
      instituicao_requerente: 'BCO SANTANDER (BRASIL) S.A.',
    },
    api_context: {
      endpoint: 'https://example.com/consents',
      http_status: '2XX',
      interaction_id: 'abc',
    },
  });

  assert.deepStrictEqual(context, {
    id: '177888',
    title: 'Teste',
    status: 'EM ATENDIMENTO N2',
    type: '1',
    sr_type: 'Incidente',
    template: '20',
    problem_type: 'Erro na Jornada ou Dados',
    problem_sub_type: 'Trabalhando os Dados',
    third_level_category: 'Tipo F V3',
    assigned_group: 'N2_Santander',
    request_user: 'Open Finance Santander',
    responsibility: 'Analista',
    current_support_level: '2',
    instituicao_requerente: 'BCO SANTANDER (BRASIL) S.A.',
    endpoint: 'https://example.com/consents',
    http_status: '2XX',
    interaction_id: 'abc',
  });
});

test('classifyTicketWithRules assigns owner when a rule group matches', () => {
  const owners = [
    { id: 1, slug: 'consentimentos-outbound', name: 'Consentimentos Outbound', is_fallback_owner: false },
    { id: 2, slug: 'su-super-usuarios', name: 'SU (Super Usuário)', is_fallback_owner: true },
  ];
  const rules = [
    {
      ticket_owner_id: 1,
      rule_group_code: 'consents-endpoint',
      logical_operator: 'AND',
      field_code: 'problem_type',
      operator: 'equals',
      expected_value: 'Erro na Jornada ou Dados',
      priority_order: 1,
    },
    {
      ticket_owner_id: 1,
      rule_group_code: 'consents-endpoint',
      logical_operator: 'AND',
      field_code: 'endpoint',
      operator: 'contains',
      expected_value: '/consents/',
      priority_order: 1,
    },
  ];

  const classified = classifyTicketWithRules(
    {
      ticket: {
        category: {
          nivel1: 'Erro na Jornada ou Dados',
        },
      },
      api_context: {
        endpoint: 'https://trust-openbanking.api.santander.com.br/open-banking/consents/v3/consents/123',
      },
    },
    owners,
    rules
  );

  assert.deepStrictEqual(classified.routing, {
    owner_slug: 'consentimentos-outbound',
    owner_name: 'Consentimentos Outbound',
    resolution_type: 'automatic',
    matched_rule_group: 'consents-endpoint',
  });
});

test('classifyTicketWithRules falls back to SU when no rule matches', () => {
  const owners = [
    { id: 1, slug: 'consentimentos-outbound', name: 'Consentimentos Outbound', is_fallback_owner: false },
    { id: 2, slug: 'su-super-usuarios', name: 'SU (Super Usuário)', is_fallback_owner: true },
  ];

  const classified = classifyTicketWithRules(
    {
      ticket: {
        category: {
          nivel1: 'Outra Categoria',
        },
      },
    },
    owners,
    []
  );

  assert.deepStrictEqual(classified.routing, {
    owner_slug: 'su-super-usuarios',
    owner_name: 'SU (Super Usuário)',
    resolution_type: 'fallback_su',
    matched_rule_group: null,
  });
});

test('classifyTicketWithRules falls back to default SU owner when no fallback owner is configured', () => {
  const owners = [
    { id: 1, slug: 'consentimentos-outbound', name: 'Consentimentos Outbound', is_fallback_owner: false },
  ];

  const classified = classifyTicketWithRules(
    {
      ticket: {
        category: {
          nivel1: 'Outra Categoria',
        },
      },
    },
    owners,
    []
  );

  assert.deepStrictEqual(classified.routing, {
    owner_slug: 'su-super-usuarios',
    owner_name: 'SU (Super Usuário)',
    resolution_type: 'fallback_su',
    matched_rule_group: null,
  });
});

test('classifyTicketWithRules handles regex operator', () => {
  const owners = [
    { id: 1, slug: 'consentimentos', name: 'Consentimentos', is_fallback_owner: false },
    { id: 2, slug: 'su-super-usuarios', name: 'SU', is_fallback_owner: true },
  ];
  const rules = [
    {
      ticket_owner_id: 1,
      rule_group_code: 'regex-group',
      logical_operator: 'AND',
      field_code: 'endpoint',
      operator: 'regex',
      expected_value: '^https?://.*\\.santander\\.com\\.br',
      priority_order: 1,
    },
  ];

  const classified = classifyTicketWithRules(
    { api_context: { endpoint: 'https://api.santander.com.br/consents' } },
    owners,
    rules
  );

  assert.strictEqual(classified.routing.owner_slug, 'consentimentos');
  assert.strictEqual(classified.routing.resolution_type, 'automatic');
});

test('classifyTicketWithRules handles invalid regex gracefully', () => {
  const owners = [
    { id: 1, slug: 'owner', name: 'Owner', is_fallback_owner: false },
    { id: 2, slug: 'su', name: 'SU', is_fallback_owner: true },
  ];
  const rules = [
    {
      ticket_owner_id: 1,
      rule_group_code: 'bad-regex-group',
      logical_operator: 'AND',
      field_code: 'endpoint',
      operator: 'regex',
      expected_value: '[invalid regex',
      priority_order: 1,
    },
  ];

  const classified = classifyTicketWithRules(
    { api_context: { endpoint: 'https://example.com' } },
    owners,
    rules
  );

  assert.strictEqual(classified.routing.resolution_type, 'fallback_su');
});

test('classifyTicketWithRules returns rule_conflict when two groups match', () => {
  const owners = [
    { id: 1, slug: 'owner-a', name: 'Owner A', is_fallback_owner: false },
    { id: 2, slug: 'owner-b', name: 'Owner B', is_fallback_owner: false },
    { id: 3, slug: 'su', name: 'SU', is_fallback_owner: true },
  ];
  const rules = [
    {
      ticket_owner_id: 1,
      rule_group_code: 'group-a',
      logical_operator: 'AND',
      field_code: 'status',
      operator: 'equals',
      expected_value: 'NOVO',
      priority_order: 1,
    },
    {
      ticket_owner_id: 2,
      rule_group_code: 'group-b',
      logical_operator: 'AND',
      field_code: 'status',
      operator: 'equals',
      expected_value: 'NOVO',
      priority_order: 2,
    },
  ];

  const classified = classifyTicketWithRules(
    { ticket: { status: 'NOVO' } },
    owners,
    rules
  );

  assert.strictEqual(classified.routing.resolution_type, 'rule_conflict');
  assert.strictEqual(classified.routing.owner_slug, 'su');
});

test('classifyTicketWithRules OR operator matches if any condition is true', () => {
  const owners = [
    { id: 1, slug: 'owner', name: 'Owner', is_fallback_owner: false },
    { id: 2, slug: 'su', name: 'SU', is_fallback_owner: true },
  ];
  const rules = [
    {
      ticket_owner_id: 1,
      rule_group_code: 'or-group',
      logical_operator: 'OR',
      field_code: 'status',
      operator: 'equals',
      expected_value: 'NOVO',
      priority_order: 1,
    },
    {
      ticket_owner_id: 1,
      rule_group_code: 'or-group',
      logical_operator: 'OR',
      field_code: 'status',
      operator: 'equals',
      expected_value: 'CANCELADO',
      priority_order: 1,
    },
  ];

  const classified = classifyTicketWithRules(
    { ticket: { status: 'NOVO' } },
    owners,
    rules
  );

  assert.strictEqual(classified.routing.owner_slug, 'owner');
  assert.strictEqual(classified.routing.resolution_type, 'automatic');
});
