const test = require('node:test');
const assert = require('node:assert');

const {
  collectRawFields,
  normalizeActivity,
  normalizeAttachment,
  normalizeNote,
} = require('../../src/utils/openFinanceTicketEntries');

test('collectRawFields filters only allowed keys', () => {
  const ticket = {
    info: [
      { key: 'CustomColumn68sr', keyCaption: 'URL', value: '/v3/consents' },
      { key: 'CustomColumn156sr', keyCaption: 'Fapi ID', value: 'uuid-123' },
      { key: 'CustomColumnOther', value: 'ignored' },
      null,
      { value: 'no key' },
    ],
  };

  const result = collectRawFields(ticket);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].key, 'CustomColumn68sr');
  assert.strictEqual(result[1].key, 'CustomColumn156sr');
});

test('collectRawFields returns empty array for missing info', () => {
  assert.deepStrictEqual(collectRawFields({}), []);
  assert.deepStrictEqual(collectRawFields({ info: null }), []);
});

test('normalizeActivity maps all fields', () => {
  const result = normalizeActivity({
    id: 1,
    userName: 'Rafael',
    description: 'Nota adicionada',
    fullLogDateTime: '2026-03-29T10:00:00',
    logTime: 1711706400000,
    type: 'note',
  });

  assert.strictEqual(result.id, 1);
  assert.strictEqual(result.user_name, 'Rafael');
  assert.strictEqual(result.description, 'Nota adicionada');
  assert.strictEqual(result.type, 'note');
  assert.ok(result.logged_at);
  assert.ok(result.logged_at_ms);
});

test('normalizeActivity returns nulls for empty input', () => {
  const result = normalizeActivity({});
  assert.strictEqual(result.id, null);
  assert.strictEqual(result.user_name, null);
  assert.strictEqual(result.description, null);
  assert.strictEqual(result.type, null);
});

test('normalizeNote maps all fields', () => {
  const result = normalizeNote({
    userName: 'Ana',
    createDate: '2026-03-29T10:00:00',
    text: 'Observação importante',
  });

  assert.strictEqual(result.user_name, 'Ana');
  assert.strictEqual(result.text, 'Observação importante');
  assert.ok(result.create_date);
});

test('normalizeNote returns nulls for empty input', () => {
  const result = normalizeNote({});
  assert.strictEqual(result.user_name, null);
  assert.strictEqual(result.text, null);
  assert.strictEqual(result.create_date, null);
});

test('normalizeAttachment builds download_url when all params present', () => {
  const result = normalizeAttachment(
    { fileId: 'file-1', srID: '9999', name: 'evidencia.png', contentType: 'image/png', size: 1024 },
    null,
    'https://servicedesk.example.com'
  );

  assert.ok(result.download_url);
  assert.ok(result.download_url.includes('file-1'));
  assert.ok(result.download_url.includes('9999'));
  assert.strictEqual(result.file_name, 'evidencia.png');
  assert.strictEqual(result.content_type, 'image/png');
});

test('normalizeAttachment sets download_url to null when serviceDeskBaseUrl is missing', () => {
  const result = normalizeAttachment(
    { fileId: 'file-1', srID: '9999' },
    null,
    null
  );
  assert.strictEqual(result.download_url, null);
});

test('normalizeAttachment sets download_url to null when fileId is missing', () => {
  const result = normalizeAttachment(
    { srID: '9999' },
    null,
    'https://servicedesk.example.com'
  );
  assert.strictEqual(result.download_url, null);
});

test('normalizeAttachment uses parentTicketId fallback when srID is absent', () => {
  const result = normalizeAttachment(
    { fileId: 'file-2', name: 'doc.pdf' },
    '8888',
    'https://servicedesk.example.com'
  );
  assert.strictEqual(result.ticket_id, '8888');
  assert.ok(result.download_url.includes('8888'));
});
