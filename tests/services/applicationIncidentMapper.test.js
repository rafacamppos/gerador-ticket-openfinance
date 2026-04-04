const test = require('node:test');
const assert = require('node:assert');
const { normalizeIncidentRow } = require('../../src/services/applicationIncidentMapper');

test('normalizeIncidentRow maps raw DB row to normalized shape', () => {
  const row = {
    id: 42,
    team_slug: 'consentimentos',
    team_name: 'Consentimentos',
    x_fapi_interaction_id: '550e8400-e29b-41d4-a716-446655440000',
    authorization_server: '550e8400-e29b-41d4-a716-446655440001',
    client_id: '550e8400-e29b-41d4-a716-446655440002',
    endpoint: '/consents/v3/consents',
    method: 'POST',
    payload_request: { consentId: 'urn:abc' },
    payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
    occurred_at: '2025-01-15T10:30:00Z',
    http_status_code: 500,
    description: 'Erro ao processar consentimento',
    incident_status: 'new',
    related_ticket_id: 177888,
    assigned_to_user_id: 7,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T11:00:00Z',
  };

  const result = normalizeIncidentRow(row);

  assert.strictEqual(result.id, '42');
  assert.strictEqual(result.team_slug, 'consentimentos');
  assert.strictEqual(result.endpoint, '/consents/v3/consents');
  assert.deepStrictEqual(result.payload_request, { consentId: 'urn:abc' });
  assert.deepStrictEqual(result.payload_response, { error: 'DETALHE_PGTO_INVALIDO' });
  assert.strictEqual(result.occurred_at, '2025-01-15T10:30:00Z');
  assert.strictEqual(result.http_status_code, 500);
  assert.strictEqual(result.description, 'Erro ao processar consentimento');
  assert.strictEqual(result.related_ticket_id, '177888');
  assert.strictEqual(result.assigned_to_user_id, '7');
  assert.ok(result.incident_status_label);
});

test('normalizeIncidentRow handles missing optional fields', () => {
  const result = normalizeIncidentRow({});
  assert.strictEqual(result.id, null);
  assert.strictEqual(result.team_slug, null);
  assert.strictEqual(result.related_ticket_id, null);
  assert.strictEqual(result.assigned_to_user_id, null);
  assert.strictEqual(result.description, null);
});

test('normalizeIncidentRow returns empty objects for missing payloads', () => {
  const result = normalizeIncidentRow({});
  assert.deepStrictEqual(result.payload_request, {});
  assert.deepStrictEqual(result.payload_response, {});
});

test('normalizeIncidentRow exposes ticket_context when template_id is present', () => {
  const row = {
    template_id: 123328,
    destinatario: 'ITAÚ UNIBANCO S.A.',
    category_name: 'Erro na Jornada ou Dados',
    sub_category_name: 'Obtendo um Consentimento',
    third_level_category_name: 'Criação de Consentimento',
    api_name_version: 'Open Banking Brasil Consents API 3.0',
    api_version: '3.0.0',
    product_feature: 'Consentimentos',
    stage_name_version: 'Consents v3.0',
  };

  const result = normalizeIncidentRow(row);

  assert.notStrictEqual(result.ticket_context, null);
  assert.strictEqual(result.ticket_context.template_id, '123328');
  assert.strictEqual(result.ticket_context.destinatario, 'ITAÚ UNIBANCO S.A.');
  assert.strictEqual(result.ticket_context.category_name, 'Erro na Jornada ou Dados');
  assert.strictEqual(result.ticket_context.api_name_version, 'Open Banking Brasil Consents API 3.0');
});

test('normalizeIncidentRow sets ticket_context to null when template_id is absent', () => {
  const result = normalizeIncidentRow({ id: 1 });
  assert.strictEqual(result.ticket_context, null);
});
