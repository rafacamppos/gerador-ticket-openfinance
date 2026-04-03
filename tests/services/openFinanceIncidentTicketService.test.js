const test = require('node:test');
const assert = require('node:assert');
const { buildInfoPayload } = require('../../src/services/openFinanceIncidentTicketService');

const TEMPLATE_FIELDS_123328 = [
  { field_name: 'Destinatário',                                field_label_api: 'CustomColumn38sr',  field_type: 'text',              is_required: true },
  { field_name: 'Seu client_id neste participante',            field_label_api: 'CustomColumn72sr',  field_type: 'text',              is_required: true },
  { field_name: 'URL do endpoint acionado',                    field_label_api: 'CustomColumn68sr',  field_type: 'long',              is_required: true },
  { field_name: 'Headers e Payload da solicitação (Request)',  field_label_api: 'CustomColumn69sr',  field_type: 'long',              is_required: true },
  { field_name: 'Código HTTP da resposta',                     field_label_api: 'CustomColumn229sr', field_type: 'list',              is_required: true },
  { field_name: 'Headers e Payload da resposta (Response)',    field_label_api: 'CustomColumn71sr',  field_type: 'long',              is_required: true },
  { field_name: 'Nome e Versão da API',                        field_label_api: 'CustomColumn114sr', field_type: 'text',              is_required: true },
  { field_name: 'Versão API',                                  field_label_api: 'CustomColumn115sr', field_type: 'text',              is_required: true },
  { field_name: 'Produto/Funcionalidade',                      field_label_api: 'CustomColumn165sr', field_type: 'text',              is_required: true },
  { field_name: 'Etapa(nome e versão api)',                    field_label_api: 'CustomColumn166sr', field_type: 'text',              is_required: true },
  { field_name: 'Tipo do Cliente',                             field_label_api: 'CustomColumn120sr', field_type: 'list_multi_select', is_required: true },
  { field_name: 'Canal da Jornada',                            field_label_api: 'CustomColumn174sr', field_type: 'list',              is_required: true },
  { field_name: 'X-Fapi-Interaction-ID',                       field_label_api: 'CustomColumn156sr', field_type: 'long',              is_required: true },
];

const BASE_CONTEXT = {
  x_fapi_interaction_id: 'fapi-uuid-0001',
  authorization_server:  'auth-uuid-0001',
  client_id:             'client-uuid-0001',
  endpoint:              '/open-banking/consents/v3/consents',
  method:                'POST',
  payload_request:       { consentId: 'urn:abc' },
  payload_response:      { error: 'DETALHE_PGTO_INVALIDO' },
  http_status_code:      422,
  description:           'Erro ao criar consentimento',
  destinatario:          'ITAÚ UNIBANCO S.A.',
  api_name_version:      'Open Banking Brasil Consents API 3.0',
  api_version:           '3.0.0',
  product_feature:       'Consentimentos',
  stage_name_version:    'Consents v3.0',
  tipo_cliente:          'PF',
  canal_jornada:         'Mobile',
};

test('buildInfoPayload builds full info array from enriched context', () => {
  const { info, missing } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);

  assert.strictEqual(missing.length, 0, `Campos faltando: ${missing.join(', ')}`);
  assert.strictEqual(info.length, TEMPLATE_FIELDS_123328.length);

  const byField = Object.fromEntries(info.map((e) => [e.field, e.value]));

  assert.strictEqual(byField.CustomColumn38sr,  'ITAÚ UNIBANCO S.A.');
  assert.strictEqual(byField.CustomColumn72sr,  'client-uuid-0001');
  assert.strictEqual(byField.CustomColumn68sr,  'POST /open-banking/consents/v3/consents');
  assert.strictEqual(byField.CustomColumn229sr, '422');
  assert.strictEqual(byField.CustomColumn114sr, 'Open Banking Brasil Consents API 3.0');
  assert.strictEqual(byField.CustomColumn115sr, '3.0.0');
  assert.strictEqual(byField.CustomColumn165sr, 'Consentimentos');
  assert.strictEqual(byField.CustomColumn166sr, 'Consents v3.0');
  assert.strictEqual(byField.CustomColumn120sr, 'PF');
  assert.strictEqual(byField.CustomColumn174sr, 'Mobile');
  assert.strictEqual(byField.CustomColumn156sr, 'fapi-uuid-0001');
  assert.deepStrictEqual(JSON.parse(byField.CustomColumn69sr), { consentId: 'urn:abc' });
  assert.deepStrictEqual(JSON.parse(byField.CustomColumn71sr), { error: 'DETALHE_PGTO_INVALIDO' });
});

test('buildInfoPayload reports missing required fields', () => {
  const context = { ...BASE_CONTEXT, tipo_cliente: '', canal_jornada: '' };
  const { missing } = buildInfoPayload(TEMPLATE_FIELDS_123328, context);

  assert.ok(missing.includes('Tipo do Cliente'), 'Tipo do Cliente deveria estar ausente');
  assert.ok(missing.includes('Canal da Jornada'), 'Canal da Jornada deveria estar ausente');
});

test('buildInfoPayload returns empty string for unknown field_label_api', () => {
  const fields = [
    { field_name: 'Campo Desconhecido', field_label_api: 'CustomColumnXXXsr', field_type: 'text', is_required: false },
  ];

  const { info, missing } = buildInfoPayload(fields, BASE_CONTEXT);

  assert.strictEqual(missing.length, 0);
  assert.strictEqual(info[0].value, '');
});

test('buildInfoPayload serializes payload_request and payload_response as JSON strings', () => {
  const { info } = buildInfoPayload(TEMPLATE_FIELDS_123328, BASE_CONTEXT);
  const byField = Object.fromEntries(info.map((e) => [e.field, e.value]));

  assert.strictEqual(typeof byField.CustomColumn69sr, 'string');
  assert.strictEqual(typeof byField.CustomColumn71sr, 'string');
  assert.doesNotThrow(() => JSON.parse(byField.CustomColumn69sr));
  assert.doesNotThrow(() => JSON.parse(byField.CustomColumn71sr));
});
