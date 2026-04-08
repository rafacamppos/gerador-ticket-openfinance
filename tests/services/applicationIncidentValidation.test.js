const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeUuid,
  normalizeTeamSlug,
  normalizeJsonPayload,
  normalizeTipoCliente,
  normalizeCanalJornada,
  normalizeTitle,
  normalizeDescription,
  normalizeEndpoint,
  normalizeHttpMethod,
  normalizeTimestamp,
  normalizeHttpStatusCode,
  normalizeRelatedTicketId,
} = require('../../src/services/applicationIncidentValidation');

test('normalizeUuid accepts valid UUID', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';
  assert.strictEqual(normalizeUuid(uuid, 'field'), uuid);
});

test('normalizeUuid throws for empty value', () => {
  assert.throws(() => normalizeUuid('', 'field'), /required/i);
});

test('normalizeUuid throws for invalid UUID', () => {
  assert.throws(() => normalizeUuid('not-a-uuid', 'field'), /valid UUID/i);
});

test('normalizeTeamSlug returns trimmed slug', () => {
  assert.strictEqual(normalizeTeamSlug('  consentimentos  '), 'consentimentos');
});

test('normalizeTeamSlug throws for empty value', () => {
  assert.throws(() => normalizeTeamSlug(''), /required/i);
});

test('normalizeJsonPayload accepts object', () => {
  const payload = { error: 'test' };
  assert.deepStrictEqual(normalizeJsonPayload(payload, 'payload_request'), payload);
});

test('normalizeJsonPayload throws for non-object', () => {
  assert.throws(() => normalizeJsonPayload('string', 'payload_request'), /JSON object/i);
  assert.throws(() => normalizeJsonPayload(null, 'payload_request'), /JSON object/i);
});

test('normalizeTipoCliente aceita PF e PJ', () => {
  assert.strictEqual(normalizeTipoCliente('PF'), 'PF');
  assert.strictEqual(normalizeTipoCliente('PJ'), 'PJ');
});

test('normalizeTipoCliente throws para valor invalido', () => {
  assert.throws(() => normalizeTipoCliente('X'), /must be one of/i);
});

test('normalizeTipoCliente throws para valor vazio', () => {
  assert.throws(() => normalizeTipoCliente(''), /required/i);
  assert.throws(() => normalizeTipoCliente(null), /required/i);
});

test('normalizeCanalJornada aceita todos os canais validos', () => {
  const canais = ['APP_TO_APP', 'APP_TO_BROWSER', 'BROWSER_TO_BROWSER', 'BROWSER_TO_APP', 'NA'];
  const esperados = ['App to app', 'App to browser', 'Browser to browser', 'Browser to app', 'Não se aplica'];
  for (const [index, canal] of canais.entries()) {
    assert.strictEqual(normalizeCanalJornada(canal), esperados[index]);
  }
});

test('normalizeCanalJornada throws para valor invalido', () => {
  assert.throws(() => normalizeCanalJornada('Inválido'), /must be one of/i);
});

test('normalizeCanalJornada throws para valor vazio', () => {
  assert.throws(() => normalizeCanalJornada(''), /required/i);
  assert.throws(() => normalizeCanalJornada(null), /required/i);
});

test('normalizeTitle accepts valid string', () => {
  assert.strictEqual(normalizeTitle('Falha na criação de consentimento'), 'Falha na criação de consentimento');
});

test('normalizeTitle throws for empty value', () => {
  assert.throws(() => normalizeTitle(''), /required/i);
  assert.throws(() => normalizeTitle(null), /required/i);
});

test('normalizeTitle throws when longer than 255 characters', () => {
  assert.throws(() => normalizeTitle('x'.repeat(256)), /255/i);
});

test('normalizeDescription accepts valid string', () => {
  assert.strictEqual(normalizeDescription('Erro ao processar'), 'Erro ao processar');
});

test('normalizeDescription throws for empty value', () => {
  assert.throws(() => normalizeDescription(''), /required/i);
  assert.throws(() => normalizeDescription(null), /required/i);
});

test('normalizeDescription throws when longer than 1024 characters', () => {
  assert.throws(() => normalizeDescription('x'.repeat(1025)), /1024/i);
});

test('normalizeEndpoint returns trimmed value', () => {
  assert.strictEqual(normalizeEndpoint('  /api/v1  '), '/api/v1');
});

test('normalizeEndpoint throws for empty value', () => {
  assert.throws(() => normalizeEndpoint(''), /required/i);
});

test('normalizeHttpMethod accepts valid methods', () => {
  assert.strictEqual(normalizeHttpMethod('get'), 'GET');
  assert.strictEqual(normalizeHttpMethod('POST'), 'POST');
});

test('normalizeHttpMethod throws for invalid method', () => {
  assert.throws(() => normalizeHttpMethod('INVALID'), /valid HTTP method/i);
});

test('normalizeHttpMethod throws for empty value', () => {
  assert.throws(() => normalizeHttpMethod(''), /required/i);
});

test('normalizeTimestamp accepts ISO string', () => {
  const ts = '2025-01-15T10:30:00.000Z';
  assert.strictEqual(normalizeTimestamp(ts), ts);
});

test('normalizeTimestamp preserves local datetime without timezone', () => {
  const ts = '2026-04-08T10:30:00';
  assert.strictEqual(normalizeTimestamp(ts), ts);
});

test('normalizeTimestamp normalizes local datetime with blank separator', () => {
  const ts = '2026-04-08 10:30:00';
  assert.strictEqual(normalizeTimestamp(ts), '2026-04-08T10:30:00');
});

test('normalizeTimestamp throws for invalid date', () => {
  assert.throws(() => normalizeTimestamp('not-a-date'), /valid timestamp/i);
});

test('normalizeTimestamp throws for null', () => {
  assert.throws(() => normalizeTimestamp(null), /required/i);
});

test('normalizeHttpStatusCode accepts valid status codes', () => {
  assert.strictEqual(normalizeHttpStatusCode(200), 200);
  assert.strictEqual(normalizeHttpStatusCode(500), 500);
});

test('normalizeHttpStatusCode throws for out-of-range code', () => {
  assert.throws(() => normalizeHttpStatusCode(99), /between 100 and 599/i);
  assert.throws(() => normalizeHttpStatusCode(600), /between 100 and 599/i);
});

test('normalizeRelatedTicketId returns null for optional empty value', () => {
  assert.strictEqual(normalizeRelatedTicketId(null), null);
  assert.strictEqual(normalizeRelatedTicketId(''), null);
});

test('normalizeRelatedTicketId throws when required and empty', () => {
  assert.throws(() => normalizeRelatedTicketId(null, { required: true }), /required/i);
});

test('normalizeRelatedTicketId accepts valid ticket number', () => {
  assert.strictEqual(normalizeRelatedTicketId('177888'), 177888);
});

test('normalizeRelatedTicketId throws for non-integer', () => {
  assert.throws(() => normalizeRelatedTicketId('abc'), /valid ticket number/i);
});
