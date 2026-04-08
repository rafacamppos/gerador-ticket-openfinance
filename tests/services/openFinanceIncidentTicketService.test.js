const test = require('node:test');
const assert = require('node:assert');
const incidentTicketRepository = require('../../src/repositories/incidentTicketRepository');
const applicationIncidentRepository = require('../../src/repositories/applicationIncidentRepository');
const ticketFlowRepository = require('../../src/repositories/ticketFlowRepository');
const openFinanceDeskClient = require('../../src/clients/openFinanceDeskClient');
const {
  buildInfoPayload,
  createTicketFromIncident,
  getTicketPreview,
} = require('../../src/services/openFinanceIncidentTicketService');

const HTTP_STATUS_OPTIONS = { '=429': '2', '5xx': '4', '4xx': '3', '*': '1' };
const TIPO_CLIENTE_OPTIONS = { 'PF': '1', 'PJ': '2' };
const CANAL_JORNADA_OPTIONS = { 'App to app': '1', 'App to browser': '2', 'Browser to browser': '3', 'Browser to app': '4', 'Não se aplica': '5' };

const TEMPLATE_FIELDS_123328 = [
  { field_name: 'Instituição Financeira Destinatária',         field_label_api: 'CustomColumn41sr',  field_type: 'text',              is_required: true,  context_key: 'destinatario',          list_options: null },
  { field_name: 'Seu client_id neste participante',            field_label_api: 'CustomColumn72sr',  field_type: 'text',              is_required: true,  context_key: 'client_id',             list_options: null },
  { field_name: 'URL do endpoint acionado',                    field_label_api: 'CustomColumn68sr',  field_type: 'long',              is_required: true,  context_key: 'endpoint',              list_options: null },
  { field_name: 'Headers e Payload da solicitação (Request)',  field_label_api: 'CustomColumn69sr',  field_type: 'long',              is_required: true,  context_key: 'payload_request',       list_options: null },
  { field_name: 'Código HTTP da resposta',                     field_label_api: 'CustomColumn229sr', field_type: 'list',              is_required: true,  context_key: 'http_status_code',      list_options: HTTP_STATUS_OPTIONS },
  { field_name: 'Headers e Payload da resposta (Response)',    field_label_api: 'CustomColumn71sr',  field_type: 'long',              is_required: true,  context_key: 'payload_response',      list_options: null },
  { field_name: 'Nome e Versão da API',                        field_label_api: 'CustomColumn114sr', field_type: 'text',              is_required: true,  context_key: 'api_name_version',      list_options: null },
  { field_name: 'Versão API',                                  field_label_api: 'CustomColumn115sr', field_type: 'text',              is_required: true,  context_key: 'api_version',           list_options: null },
  { field_name: 'Produto/Funcionalidade',                      field_label_api: 'CustomColumn165sr', field_type: 'text',              is_required: true,  context_key: 'product_feature',       list_options: null },
  { field_name: 'Etapa(nome e versão api)',                    field_label_api: 'CustomColumn166sr', field_type: 'text',              is_required: true,  context_key: 'stage_name_version',    list_options: null },
  { field_name: 'Tipo do Cliente',                             field_label_api: 'CustomColumn120sr', field_type: 'list_multi_select', is_required: true,  context_key: 'tipo_cliente',          list_options: TIPO_CLIENTE_OPTIONS },
  { field_name: 'Canal da Jornada',                            field_label_api: 'CustomColumn174sr', field_type: 'list',              is_required: true,  context_key: 'canal_jornada',         list_options: CANAL_JORNADA_OPTIONS },
  { field_name: 'X-Fapi-Interaction-ID',                       field_label_api: 'CustomColumn156sr', field_type: 'long',              is_required: true,  context_key: 'x_fapi_interaction_id', list_options: null },
];

const BASE_CONTEXT = {
  x_fapi_interaction_id: 'fapi-uuid-0001',
  authorization_server:  'auth-uuid-0001',
  client_id:             'client-uuid-0001',
  endpoint:              '/open-banking/consents/v3/consents',
  method:                'POST',
  title:                 'Erro ao criar consentimento',
  payload_request:       { consentId: 'urn:abc' },
  payload_response:      { error: 'DETALHE_PGTO_INVALIDO' },
  http_status_code:      422,
  description:           'Erro ao criar consentimento',
  category_name:         'Erro na Jornada ou Dados',
  sub_category_name:     'Obtendo um Consentimento',
  third_level_category_name: 'Criação de Consentimento',
  destinatario:          'ITAÚ UNIBANCO S.A.',
  api_name_version:      'Open Banking Brasil Consents API 3.0',
  api_version:           '3.0.0',
  product_feature:       'Consentimentos',
  stage_name_version:    'Consents v3.0',
  tipo_cliente:          'PF',
  canal_jornada:         'App to app',
  assigned_to_user_id:   42,
  assigned_to_name:      'Angela Costa',
  assigned_to_email:     'angela@example.com',
};

test('buildInfoPayload uses key (not field) for all entries', () => {
  const { info } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);

  for (const entry of info) {
    assert.ok('key' in entry, `entry deve ter "key": ${JSON.stringify(entry)}`);
    assert.ok(!('field' in entry), `entry nao deve ter "field": ${JSON.stringify(entry)}`);
  }
});

test('buildInfoPayload includes base fields before custom columns', () => {
  const { info } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);

  const byKey = Object.fromEntries(info.map((e) => [e.key, e.value]));

  assert.strictEqual(byKey.title,                'Erro ao criar consentimento');
  assert.strictEqual(byKey.description,          'Erro ao criar consentimento');
  assert.strictEqual(
    byKey.problem_type,
    'Incidentes_Erro na Jornada ou Dados_Obtendo um Consentimento_Criação de Consentimento'
  );
  assert.strictEqual(byKey.problem_sub_type, undefined);
  assert.strictEqual(byKey.third_level_category, undefined);
});

test('buildInfoPayload builds full info array from enriched context', () => {
  const { info, missing } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);

  assert.strictEqual(missing.length, 0, `Campos faltando: ${missing.join(', ')}`);

  // 4 base fields + 13 custom columns
  assert.strictEqual(info.length, 4 + TEMPLATE_FIELDS_123328.length);

  const byKey = Object.fromEntries(info.map((e) => [e.key, e.value]));

  assert.strictEqual(byKey.CustomColumn41sr,  'ITAÚ UNIBANCO S.A.');
  assert.strictEqual(byKey.CustomColumn72sr,  'client-uuid-0001');
  assert.strictEqual(byKey.CustomColumn68sr,  '/open-banking/consents/v3/consents');
  assert.strictEqual(byKey.CustomColumn229sr, '3');   // 422 → 4XX → '3'
  assert.strictEqual(byKey.CustomColumn114sr, 'Open Banking Brasil Consents API 3.0');
  assert.strictEqual(byKey.CustomColumn115sr, '3.0.0');
  assert.strictEqual(byKey.CustomColumn165sr, 'Consentimentos');
  assert.strictEqual(byKey.CustomColumn166sr, 'Consents v3.0');
  assert.strictEqual(byKey.CustomColumn16sr, 'N1 Service Desk');
  assert.strictEqual(byKey.CustomColumn120sr, '1');   // PF → '1'
  assert.strictEqual(byKey.CustomColumn174sr, '1');   // App to app → '1'
  assert.strictEqual(byKey.CustomColumn156sr, 'fapi-uuid-0001');
  assert.deepStrictEqual(JSON.parse(byKey.CustomColumn69sr), { consentId: 'urn:abc' });
  assert.deepStrictEqual(JSON.parse(byKey.CustomColumn71sr), { error: 'DETALHE_PGTO_INVALIDO' });
});

test('buildInfoPayload reports missing required fields', () => {
  const context = { ...BASE_CONTEXT, tipo_cliente: '', canal_jornada: '' };
  const { missing } = buildInfoPayload(TEMPLATE_FIELDS_123328, context);

  assert.ok(missing.includes('Tipo do Cliente'), 'Tipo do Cliente deveria estar ausente');
  assert.ok(missing.includes('Canal da Jornada'), 'Canal da Jornada deveria estar ausente');
});

test('buildInfoPayload returns empty string for unknown field_label_api', () => {
  const fields = [
    { field_name: 'Campo Desconhecido', field_label_api: 'CustomColumnXXXsr', field_type: 'text', is_required: false, context_key: 'campo_desconhecido', list_options: null },
  ];

  const { info, missing } = buildInfoPayload(fields, BASE_CONTEXT);

  assert.strictEqual(missing.length, 0);
  assert.strictEqual(info.find((e) => e.key === 'CustomColumnXXXsr').value, '');
});

test('resolveHttpStatusCode maps status codes to service desk range codes', () => {
  const fields = [{ field_name: 'Código HTTP da resposta', field_label_api: 'CustomColumn229sr', field_type: 'list', is_required: true, context_key: 'http_status_code', list_options: HTTP_STATUS_OPTIONS }];

  const cases = [
    { http_status_code: 200, expected: '1' },
    { http_status_code: 201, expected: '1' },
    { http_status_code: 429, expected: '2' },
    { http_status_code: 400, expected: '3' },
    { http_status_code: 422, expected: '3' },
    { http_status_code: 500, expected: '4' },
    { http_status_code: 503, expected: '4' },
  ];

  for (const { http_status_code, expected } of cases) {
    const { info } = buildInfoPayload(fields, { ...BASE_CONTEXT, http_status_code });
    const entry = info.find((e) => e.key === 'CustomColumn229sr');
    assert.strictEqual(entry.value, expected, `status ${http_status_code} → esperado "${expected}"`);
  }
});

test('TIPO_CLIENTE_MAP converts labels to service desk codes', () => {
  const fields = [{ field_name: 'Tipo do Cliente', field_label_api: 'CustomColumn120sr', field_type: 'list_multi_select', is_required: true, context_key: 'tipo_cliente', list_options: TIPO_CLIENTE_OPTIONS }];

  const { info: infoPF } = buildInfoPayload(fields, { ...BASE_CONTEXT, tipo_cliente: 'PF' });
  assert.strictEqual(infoPF.find((e) => e.key === 'CustomColumn120sr').value, '1');

  const { info: infoPJ } = buildInfoPayload(fields, { ...BASE_CONTEXT, tipo_cliente: 'PJ' });
  assert.strictEqual(infoPJ.find((e) => e.key === 'CustomColumn120sr').value, '2');
});

test('CANAL_JORNADA_MAP converts labels to service desk codes', () => {
  const fields = [{ field_name: 'Canal da Jornada', field_label_api: 'CustomColumn174sr', field_type: 'list', is_required: true, context_key: 'canal_jornada', list_options: CANAL_JORNADA_OPTIONS }];

  const cases = [
    { canal_jornada: 'App to app',         expected: '1' },
    { canal_jornada: 'App to browser',     expected: '2' },
    { canal_jornada: 'Browser to browser', expected: '3' },
    { canal_jornada: 'Browser to app',     expected: '4' },
    { canal_jornada: 'Não se aplica',      expected: '5' },
  ];

  for (const { canal_jornada, expected } of cases) {
    const { info } = buildInfoPayload(fields, { ...BASE_CONTEXT, canal_jornada });
    assert.strictEqual(info.find((e) => e.key === 'CustomColumn174sr').value, expected, `"${canal_jornada}" → esperado "${expected}"`);
  }
});

test('buildInfoPayload serializes payload_request and payload_response as JSON strings', () => {
  const { info } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);
  const byKey = Object.fromEntries(info.map((e) => [e.key, e.value]));

  assert.strictEqual(typeof byKey.CustomColumn69sr, 'string');
  assert.strictEqual(typeof byKey.CustomColumn71sr, 'string');
  assert.doesNotThrow(() => JSON.parse(byKey.CustomColumn69sr));
  assert.doesNotThrow(() => JSON.parse(byKey.CustomColumn71sr));
});

test('getTicketPreview returns 404 when incident is not found', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => null;

  try {
    await assert.rejects(
      () => getTicketPreview('consentimentos-inbound', '10'),
      /Incidente não encontrado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('getTicketPreview returns 422 when incident has no template', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    template_id: null,
  });

  try {
    await assert.rejects(
      () => getTicketPreview('consentimentos-inbound', '10'),
      /Nenhum template de ticket encontrado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('getTicketPreview returns template fields with serialized values and visible options', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  const originalGetTemplateFields = incidentTicketRepository.getTemplateFields;

  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    template_id: 123328,
    template_type: '1',
  });
  incidentTicketRepository.getTemplateFields = async () => [
    TEMPLATE_FIELDS_123328[3],
    TEMPLATE_FIELDS_123328[4],
    TEMPLATE_FIELDS_123328[10],
  ];

  try {
    const preview = await getTicketPreview('consentimentos-inbound', '10');

    assert.deepStrictEqual(preview, {
      template_id: '123328',
      template_type: '1',
      title: 'Erro ao criar consentimento',
      description: 'Erro ao criar consentimento',
      template_fields: [
        {
          key: 'CustomColumn69sr',
          label: 'Headers e Payload da solicitação (Request)',
          required: true,
          value: JSON.stringify({ consentId: 'urn:abc' }, null, 2),
          options: null,
        },
        {
          key: 'CustomColumn229sr',
          label: 'Código HTTP da resposta',
          required: true,
          value: '422',
          options: null,
        },
        {
          key: 'CustomColumn120sr',
          label: 'Tipo do Cliente',
          required: true,
          value: 'PF',
          options: ['PF', 'PJ'],
        },
      ],
    });
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
    incidentTicketRepository.getTemplateFields = originalGetTemplateFields;
  }
});

test('createTicketFromIncident returns 404 when incident is not found', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => null;

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}),
      /Incidente não encontrado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 401 when authenticated user is missing', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    template_id: 123328,
    template_type: '1',
  });

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}, {}),
      (error) => error.status === 401 && /Usuário autenticado não encontrado/i.test(error.message)
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 409 when incident is not assigned yet', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'new',
    assigned_to_user_id: null,
    template_id: 123328,
    template_type: '1',
  });

  try {
    await assert.rejects(
      () => createTicketFromIncident(
        'consentimentos-inbound',
        '10',
        {},
        {},
        {},
        { authenticated_user_id: '7' }
      ),
      (error) =>
        error.status === 409 &&
        /precisa ser atribuído antes da criação do ticket/i.test(error.message)
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 403 when incident is assigned to another user', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 9,
    template_id: 123328,
    template_type: '1',
  });

  try {
    await assert.rejects(
      () => createTicketFromIncident(
        'consentimentos-inbound',
        '10',
        {},
        {},
        {},
        { authenticated_user_id: '7' }
      ),
      (error) =>
        error.status === 403 &&
        /Somente o usuário responsável pelo incidente pode criar o ticket/i.test(error.message)
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 409 when incident already has a created ticket', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'ticket_created',
    assigned_to_user_id: 7,
    template_id: 123328,
  });

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}, { authenticated_user_id: '7' }),
      /já foi criado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 409 when incident already has related ticket id', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    related_ticket_id: 98765,
    template_id: 123328,
    template_type: '1',
  });

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}, { authenticated_user_id: '7' }),
      (error) => {
        assert.strictEqual(error.status, 409);
        assert.deepStrictEqual(error.details, { related_ticket_id: '98765' });
        return /já foi vinculado/i.test(error.message);
      }
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 422 when incident has no template', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    template_id: null,
  });

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}, { authenticated_user_id: '7' }),
      /Nenhum template de ticket encontrado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('createTicketFromIncident returns 422 when template has no fields', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  const originalGetTemplateFields = incidentTicketRepository.getTemplateFields;

  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    template_id: 123328,
    template_type: '1',
  });
  incidentTicketRepository.getTemplateFields = async () => [];

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}, { authenticated_user_id: '7' }),
      /Nenhum campo de template encontrado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
    incidentTicketRepository.getTemplateFields = originalGetTemplateFields;
  }
});

test('createTicketFromIncident returns 422 when required fields are missing in automatic payload', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  const originalGetTemplateFields = incidentTicketRepository.getTemplateFields;

  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    tipo_cliente: '',
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    template_id: 123328,
    template_type: '1',
  });
  incidentTicketRepository.getTemplateFields = async () => [TEMPLATE_FIELDS_123328[10]];

  try {
    await assert.rejects(
      () => createTicketFromIncident('consentimentos-inbound', '10', {}, {}, {}, { authenticated_user_id: '7' }),
      /Campos obrigatórios não preenchidos: Tipo do Cliente/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
    incidentTicketRepository.getTemplateFields = originalGetTemplateFields;
  }
});

test('createTicketFromIncident creates ticket with automatic template payload and updates incident', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  const originalGetTemplateFields = incidentTicketRepository.getTemplateFields;
  const originalPostJson = openFinanceDeskClient.postJson;
  const originalTransitionIncident = applicationIncidentRepository.transitionIncident;
  const originalUpsertInitialStateWithEvent = ticketFlowRepository.upsertInitialStateWithEvent;
  let captured = null;
  let capturedState = null;

  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    template_id: 123328,
    template_type: '1',
    team_slug: 'consentimentos-inbound',
    team_name: 'Consentimentos Inbound',
  });
  incidentTicketRepository.getTemplateFields = async () => [
    TEMPLATE_FIELDS_123328[0],
    TEMPLATE_FIELDS_123328[4],
    TEMPLATE_FIELDS_123328[10],
  ];
  openFinanceDeskClient.postJson = async (path, body, query, headers, context) => {
    captured = { path, body, query, headers, context };
    return { id: 98765, protocol: 'SR-98765' };
  };
  ticketFlowRepository.upsertInitialStateWithEvent = async (state) => {
    capturedState = state;
    return state;
  };
  applicationIncidentRepository.transitionIncident = async (_teamSlug, _incidentId, payload) => ({
    id: 10,
    team_slug: 'consentimentos-inbound',
    team_name: 'Consentimentos Inbound',
    title: 'Titulo atualizado',
    description: 'Descrição atualizada',
    tipo_cliente: 'PF',
    canal_jornada: 'App to app',
    payload_request: { consentId: 'urn:abc' },
    payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
    occurred_at: '2026-03-29T10:15:00.000Z',
    http_status_code: 422,
    incident_status: payload.incident_status,
    related_ticket_id: payload.related_ticket_id,
  });

  try {
    const response = await createTicketFromIncident(
      'consentimentos-inbound',
      '10',
      {
        title: 'Titulo atualizado',
        description: 'Descrição atualizada',
      },
      {
        cookie: 'JSESSIONID=abc',
      },
      {
        environmentBaseUrl: 'https://sandbox.example.com',
      },
      {
        authenticated_user_id: '7',
      }
    );

    assert.deepStrictEqual(captured, {
      path: '/sr',
      body: {
        info: [
          { key: 'title', value: 'Titulo atualizado' },
          { key: 'description', value: 'Descrição atualizada' },
          {
            key: 'problem_type',
            value: 'Incidentes_Erro na Jornada ou Dados_Obtendo um Consentimento_Criação de Consentimento',
          },
          {
            key: 'CustomColumn16sr',
            value: 'N1 Service Desk',
            valueClass: '',
            valueCaption: 'N1 Service Desk',
            keyCaption: 'Equipe solucionadora',
          },
          { key: 'CustomColumn41sr', value: 'ITAÚ UNIBANCO S.A.' },
          { key: 'CustomColumn229sr', value: '3' },
          { key: 'CustomColumn120sr', value: '1' },
        ],
      },
      query: {
        template: 123328,
        type: '1',
      },
      headers: {
        cookie: 'JSESSIONID=abc',
      },
      context: {
        environmentBaseUrl: 'https://sandbox.example.com',
      },
    });
    assert.strictEqual(response.ticket_id, '98765');
    assert.strictEqual(response.ticket.id, 98765);
    assert.strictEqual(response.incident.incident_status, 'ticket_created');
    assert.strictEqual(response.incident.related_ticket_id, '98765');
    assert.deepStrictEqual(capturedState, {
      ticket_id: '98765',
      ticket_title: 'Titulo atualizado',
      ticket_status: 'NOVO',
      requester_company_name: 'BCO SANTANDER (BRASIL) S.A.',
      requester_company_key: 'bco_santander_brasil_s_a',
      current_stage: 'accepted_by_owner',
      current_owner_slug: 'consentimentos-inbound',
      assigned_owner_slug: 'consentimentos-inbound',
      accepted_by_team: true,
      responded_by_team: false,
      returned_to_su: false,
      actor_name: 'Angela Costa',
      actor_email: 'angela@example.com',
    });
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
    incidentTicketRepository.getTemplateFields = originalGetTemplateFields;
    openFinanceDeskClient.postJson = originalPostJson;
    applicationIncidentRepository.transitionIncident = originalTransitionIncident;
    ticketFlowRepository.upsertInitialStateWithEvent = originalUpsertInitialStateWithEvent;
  }
});

test('createTicketFromIncident returns 502 when ServiceDesk does not return ticket id', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  const originalGetTemplateFields = incidentTicketRepository.getTemplateFields;
  const originalPostJson = openFinanceDeskClient.postJson;
  const originalTransitionIncident = applicationIncidentRepository.transitionIncident;
  const originalUpsertInitialStates = ticketFlowRepository.upsertInitialStates;
  let captured = null;

  incidentTicketRepository.getIncidentTicketContext = async () => ({
    ...BASE_CONTEXT,
    id: 10,
    incident_status: 'assigned',
    assigned_to_user_id: 7,
    template_id: 123328,
    template_type: '1',
  });
  incidentTicketRepository.getTemplateFields = async () => [
    TEMPLATE_FIELDS_123328[4],
    TEMPLATE_FIELDS_123328[10],
    TEMPLATE_FIELDS_123328[11],
  ];
  openFinanceDeskClient.postJson = async (_path, body) => {
    captured = body;
    return { id: null };
  };
  applicationIncidentRepository.transitionIncident = async () => {
    throw new Error('transitionIncident should not be called');
  };
  ticketFlowRepository.upsertInitialStates = async () => {
    throw new Error('upsertInitialStates should not be called');
  };

  try {
    await assert.rejects(
      () => createTicketFromIncident(
        'consentimentos-inbound',
        '10',
        {
          template_fields: [
            { key: 'CustomColumn229sr', value: 429 },
            { key: 'CustomColumn120sr', value: 'PJ' },
            { key: 'CustomColumn174sr', value: 'Não se aplica' },
            { key: 'CampoLivre', value: null },
          ],
        },
        {},
        {},
        { authenticated_user_id: '7' }
      ),
      /não retornou o identificador do ticket criado/i
    );

    assert.deepStrictEqual(captured, {
      info: [
        { key: 'title', value: 'Erro ao criar consentimento' },
        { key: 'description', value: 'Erro ao criar consentimento' },
        {
          key: 'problem_type',
          value: 'Incidentes_Erro na Jornada ou Dados_Obtendo um Consentimento_Criação de Consentimento',
        },
        {
          key: 'CustomColumn16sr',
          value: 'N1 Service Desk',
          valueClass: '',
          valueCaption: 'N1 Service Desk',
          keyCaption: 'Equipe solucionadora',
        },
        { key: 'CustomColumn229sr', value: '2' },
        { key: 'CustomColumn120sr', value: '2' },
        { key: 'CustomColumn174sr', value: '5' },
        { key: 'CampoLivre', value: '' },
      ],
    });
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
    incidentTicketRepository.getTemplateFields = originalGetTemplateFields;
    openFinanceDeskClient.postJson = originalPostJson;
    applicationIncidentRepository.transitionIncident = originalTransitionIncident;
    ticketFlowRepository.upsertInitialStates = originalUpsertInitialStates;
  }
});
