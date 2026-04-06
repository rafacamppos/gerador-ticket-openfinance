const test = require('node:test');
const assert = require('node:assert');

const { buildRequestLogContext } = require('../../src/utils/requestLogContext');

test('buildRequestLogContext resolves request id user id and ticket id from session and params', () => {
  const context = buildRequestLogContext({
    requestId: 'req-123',
    session: {
      portalUser: {
        id: '55',
        email: 'user@example.com',
      },
    },
    params: {
      ticketId: '777',
    },
  });

  assert.deepStrictEqual(context, {
    requestId: 'req-123',
    userId: '55',
    ticketId: '777',
  });
});

test('buildRequestLogContext falls back to portal user email and body fields', () => {
  const context = buildRequestLogContext({
    session: {
      portalUser: {
        email: 'user@example.com',
      },
    },
    body: {
      user_id: '11',
      ticket_id: '888',
    },
  });

  assert.deepStrictEqual(context, {
    requestId: null,
    userId: 'user@example.com',
    ticketId: '888',
  });
});

test('buildRequestLogContext falls back to body and query fields when session is absent', () => {
  const context = buildRequestLogContext({
    body: {
      userId: '22',
    },
    query: {
      ticketId: '999',
    },
  });

  assert.deepStrictEqual(context, {
    requestId: null,
    userId: '22',
    ticketId: '999',
  });
});

test('buildRequestLogContext applies overrides and normalizes undefined ticket id to null', () => {
  const context = buildRequestLogContext(
    {
      requestId: 'req-789',
    },
    {
      route: 'listTickets',
      ticketId: undefined,
    }
  );

  assert.deepStrictEqual(context, {
    requestId: 'req-789',
    userId: null,
    ticketId: null,
    route: 'listTickets',
  });
});
