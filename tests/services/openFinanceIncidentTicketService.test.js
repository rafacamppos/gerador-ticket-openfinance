const test = require('node:test');
const assert = require('node:assert');
const { buildInfoPayload } = require('../../src/services/openFinanceIncidentTicketService');

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
  assert.strictEqual(byKey.problem_type,         'Erro na Jornada ou Dados');
  assert.strictEqual(byKey.problem_sub_type,     'Obtendo um Consentimento');
  assert.strictEqual(byKey.third_level_category, 'Criação de Consentimento');
});

test('buildInfoPayload builds full info array from enriched context', () => {
  const { info, missing } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);

  assert.strictEqual(missing.length, 0, `Campos faltando: ${missing.join(', ')}`);

  // 5 base fields + 13 custom columns
  assert.strictEqual(info.length, 5 + TEMPLATE_FIELDS_123328.length);

  const byKey = Object.fromEntries(info.map((e) => [e.key, e.value]));

  assert.strictEqual(byKey.CustomColumn41sr,  'ITAÚ UNIBANCO S.A.');
  assert.strictEqual(byKey.CustomColumn72sr,  'client-uuid-0001');
  assert.strictEqual(byKey.CustomColumn68sr,  '/open-banking/consents/v3/consents');
  assert.strictEqual(byKey.CustomColumn229sr, '3');   // 422 → 4XX → '3'
  assert.strictEqual(byKey.CustomColumn114sr, 'Open Banking Brasil Consents API 3.0');
  assert.strictEqual(byKey.CustomColumn115sr, '3.0.0');
  assert.strictEqual(byKey.CustomColumn165sr, 'Consentimentos');
  assert.strictEqual(byKey.CustomColumn166sr, 'Consents v3.0');
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
