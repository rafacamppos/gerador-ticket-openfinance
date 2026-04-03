const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeKey,
  toBoolean,
  normalizeDateTime,
  normalizeMillis,
  tryParseJson,
  summarizeDescription,
  mapEscopo,
  mapTipoCliente,
} = require('../../src/utils/openFinanceFormatterShared');

test('normalizeKey converts accented uppercase string to snake_case', () => {
  assert.strictEqual(normalizeKey('Título do Ticket'), 'titulo_do_ticket');
});

test('normalizeKey strips leading/trailing underscores', () => {
  assert.strictEqual(normalizeKey('  _foo bar_ '), 'foo_bar');
});

test('normalizeKey returns empty string for empty input', () => {
  assert.strictEqual(normalizeKey(''), '');
  assert.strictEqual(normalizeKey(null), '');
  assert.strictEqual(normalizeKey(undefined), '');
});

test('toBoolean returns true for truthy strings', () => {
  assert.strictEqual(toBoolean('true'), true);
  assert.strictEqual(toBoolean('sim'), true);
  assert.strictEqual(toBoolean('1'), true);
  assert.strictEqual(toBoolean('yes'), true);
  assert.strictEqual(toBoolean(true), true);
  assert.strictEqual(toBoolean(1), true);
});

test('toBoolean returns false for falsy strings', () => {
  assert.strictEqual(toBoolean('false'), false);
  assert.strictEqual(toBoolean('não'), false);
  assert.strictEqual(toBoolean('0'), false);
  assert.strictEqual(toBoolean(false), false);
  assert.strictEqual(toBoolean(0), false);
});

test('toBoolean returns null for unrecognized strings', () => {
  assert.strictEqual(toBoolean('maybe'), null);
  assert.strictEqual(toBoolean(null), null);
  assert.strictEqual(toBoolean(undefined), null);
});

test('normalizeDateTime handles ISO string as-is', () => {
  assert.strictEqual(normalizeDateTime('2025-01-15T10:30:00'), '2025-01-15T10:30:00');
});

test('normalizeDateTime handles dd-MM-yyyy HH:mm format', () => {
  assert.strictEqual(normalizeDateTime('15-01-2025 10:30'), '2025-01-15T10:30:00');
});

test('normalizeDateTime handles unix millis as number', () => {
  const result = normalizeDateTime(0);
  assert.ok(result.startsWith('1970-01-01'));
});

test('normalizeDateTime returns null for empty values', () => {
  assert.strictEqual(normalizeDateTime(null), null);
  assert.strictEqual(normalizeDateTime(''), null);
  assert.strictEqual(normalizeDateTime(undefined), null);
});

test('normalizeMillis returns numeric value', () => {
  assert.strictEqual(normalizeMillis(1000), 1000);
  assert.strictEqual(normalizeMillis('500'), 500);
});

test('normalizeMillis returns null for non-numeric', () => {
  assert.strictEqual(normalizeMillis('abc'), null);
  assert.strictEqual(normalizeMillis(null), null);
});

test('tryParseJson parses valid JSON object', () => {
  assert.deepStrictEqual(tryParseJson('{"a":1}'), { a: 1 });
});

test('tryParseJson returns raw string for non-JSON string', () => {
  assert.strictEqual(tryParseJson('hello world'), 'hello world');
});

test('tryParseJson returns null for empty string', () => {
  assert.strictEqual(tryParseJson(''), null);
});

test('summarizeDescription truncates long strings', () => {
  const long = 'A'.repeat(200);
  const result = summarizeDescription(long);
  assert.ok(result.endsWith('...'));
  assert.ok(result.length <= 180);
});

test('summarizeDescription returns null for empty string', () => {
  assert.strictEqual(summarizeDescription(''), null);
  assert.strictEqual(summarizeDescription('   '), null);
});

test('mapEscopo maps "1" to Bilateral', () => {
  assert.strictEqual(mapEscopo('1'), 'Bilateral');
});

test('mapEscopo maps "2" to Não bilateral', () => {
  assert.strictEqual(mapEscopo('2'), 'Não bilateral');
});

test('mapEscopo returns null for null/empty', () => {
  assert.strictEqual(mapEscopo(null), null);
  assert.strictEqual(mapEscopo(''), null);
});

test('mapTipoCliente maps "1" to PF and "2" to PJ', () => {
  assert.deepStrictEqual(mapTipoCliente('1'), ['PF']);
  assert.deepStrictEqual(mapTipoCliente('2'), ['PJ']);
});

test('mapTipoCliente handles array input', () => {
  assert.deepStrictEqual(mapTipoCliente(['1', '2']), ['PF', 'PJ']);
});

test('mapTipoCliente returns empty array for null/empty', () => {
  assert.deepStrictEqual(mapTipoCliente(null), []);
  assert.deepStrictEqual(mapTipoCliente(''), []);
});
