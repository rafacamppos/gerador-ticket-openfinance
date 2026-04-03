const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeTicketListQuery,
  normalizeTicketCreationQuery,
  resolveTicketStatusFilter,
  resolveOwnerSlugFilter,
  resolveTicketListOwner,
  shouldHideFromOperationalQueue,
} = require('../../src/services/openFinanceTicketQuery');

test('normalizeTicketListQuery maps camelCase to snake_case fields', () => {
  const result = normalizeTicketListQuery({ assignedGroup: 'N2', problemType: 'Erro' });
  assert.deepStrictEqual(result, { assigned_group: 'N2', problem_type: 'Erro' });
});

test('normalizeTicketListQuery handles snake_case input', () => {
  const result = normalizeTicketListQuery({ assigned_group: 'N2', problem_type: 'Erro' });
  assert.deepStrictEqual(result, { assigned_group: 'N2', problem_type: 'Erro' });
});

test('normalizeTicketListQuery returns empty object when no relevant fields', () => {
  assert.deepStrictEqual(normalizeTicketListQuery({}), {});
});

test('resolveTicketStatusFilter returns status label for known ID', () => {
  assert.strictEqual(resolveTicketStatusFilter({ status: '1' }), 'NOVO');
  assert.strictEqual(resolveTicketStatusFilter({ status_id: '30' }), 'CANCELADO');
});

test('resolveTicketStatusFilter returns null when status is TODOS or missing', () => {
  assert.strictEqual(resolveTicketStatusFilter({ status: '33' }), null);
  assert.strictEqual(resolveTicketStatusFilter({}), null);
});

test('resolveTicketStatusFilter accepts raw status string', () => {
  assert.strictEqual(resolveTicketStatusFilter({ status: 'NOVO' }), 'NOVO');
});

test('resolveOwnerSlugFilter returns slug from ownerSlug', () => {
  assert.strictEqual(resolveOwnerSlugFilter({ ownerSlug: 'consentimentos' }), 'consentimentos');
});

test('resolveOwnerSlugFilter returns slug from owner_slug', () => {
  assert.strictEqual(resolveOwnerSlugFilter({ owner_slug: 'consentimentos' }), 'consentimentos');
});

test('resolveOwnerSlugFilter returns null for empty query', () => {
  assert.strictEqual(resolveOwnerSlugFilter({}), null);
});

test('resolveTicketListOwner prefers flow current_owner_slug', () => {
  const ticket = {
    flow: { current_owner_slug: 'fluxo-owner' },
    routing: { owner_slug: 'routing-owner' },
  };
  assert.strictEqual(resolveTicketListOwner(ticket), 'fluxo-owner');
});

test('resolveTicketListOwner falls back to routing owner_slug', () => {
  const ticket = {
    flow: null,
    routing: { owner_slug: 'routing-owner' },
  };
  assert.strictEqual(resolveTicketListOwner(ticket), 'routing-owner');
});

test('shouldHideFromOperationalQueue returns true for CANCELADO status', () => {
  assert.strictEqual(shouldHideFromOperationalQueue({ ticket: { status: 'CANCELADO' } }), true);
  assert.strictEqual(shouldHideFromOperationalQueue({ flow: { ticket_status: 'cancelado' } }), true);
});

test('shouldHideFromOperationalQueue returns true for ATENDIMENTO ENCERRADO', () => {
  assert.strictEqual(shouldHideFromOperationalQueue({ ticket: { status: 'ATENDIMENTO ENCERRADO' } }), true);
});

test('shouldHideFromOperationalQueue returns false for active status', () => {
  assert.strictEqual(shouldHideFromOperationalQueue({ ticket: { status: 'NOVO' } }), false);
});

test('normalizeTicketCreationQuery sets default type to 1', () => {
  assert.deepStrictEqual(normalizeTicketCreationQuery({ template: '20' }), { type: '1', template: '20' });
});

test('normalizeTicketCreationQuery uses provided type', () => {
  assert.deepStrictEqual(normalizeTicketCreationQuery({ template: '20', type: '2' }), { type: '2', template: '20' });
});
