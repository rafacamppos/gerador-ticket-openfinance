const test = require('node:test');
const assert = require('node:assert');

const controller = require('../../src/controllers/openFinanceTicketFlowController');
const service = require('../../src/services/ticketFlowService');
const { createMockResponse } = require('../helpers/testHelpers');

test('listTicketFlows returns the persisted flow states', async () => {
  const originalListTicketFlows = service.listTicketFlows;

  service.listTicketFlows = async () => [
    {
      ticket_id: '119681',
      current_stage: 'routed_to_owner',
    },
  ];

  const req = { query: {} };
  const res = createMockResponse();

  try {
    await controller.listTicketFlows(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body[0].ticket_id, '119681');
  } finally {
    service.listTicketFlows = originalListTicketFlows;
  }
});

test('getTicketFlow returns current state and events for a ticket', async () => {
  const originalGetTicketFlow = service.getTicketFlow;

  service.getTicketFlow = async () => ({
    state: {
      ticket_id: '119681',
      current_stage: 'accepted_by_owner',
    },
    events: [
      {
        action: 'accept',
      },
    ],
  });

  const req = {
    params: {
      ticketId: '119681',
    },
  };
  const res = createMockResponse();

  try {
    await controller.getTicketFlow(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.state.ticket_id, '119681');
  } finally {
    service.getTicketFlow = originalGetTicketFlow;
  }
});

test('transitionTicketFlow injects the authenticated portal user into the flow transition', async () => {
  const originalTransitionTicketFlow = service.transitionTicketFlow;
  let capturedPayload = null;

  service.transitionTicketFlow = async (_ticketId, payload) => {
    capturedPayload = payload;
    return {
      state: {
        ticket_id: '119681',
        current_stage: 'accepted_by_owner',
        last_actor_name: payload.actorName,
        last_actor_email: payload.actorEmail,
      },
      events: [],
    };
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {
      action: 'accept',
      note: 'Aceite realizado pela equipe.',
    },
    session: {
      portalUser: {
        id: '1',
        name: 'Diego Sena',
        email: 'diego.sena@f1rst.com.br',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.transitionTicketFlow(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(capturedPayload.actorEmail, 'diego.sena@f1rst.com.br');
  } finally {
    service.transitionTicketFlow = originalTransitionTicketFlow;
  }
});

test('transitionTicketFlow applies the requested flow transition', async () => {
  const originalTransitionTicketFlow = service.transitionTicketFlow;

  service.transitionTicketFlow = async (ticketId, payload) => ({
    state: {
      ticket_id: ticketId,
      current_stage: 'accepted_by_owner',
    },
    events: [
      {
        action: payload.action,
      },
    ],
  });

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {
      action: 'accept',
    },
  };
  const res = createMockResponse();

  try {
    await controller.transitionTicketFlow(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.events[0].action, 'accept');
  } finally {
    service.transitionTicketFlow = originalTransitionTicketFlow;
  }
});

test('listTicketFlows forwards error to next when service throws', async () => {
  const original = service.listTicketFlows;
  service.listTicketFlows = async () => { throw new Error('db error'); };

  const req = { query: {} };
  const res = createMockResponse();
  let caught = null;

  try {
    await controller.listTicketFlows(req, res, (err) => { caught = err; });
    assert.ok(caught instanceof Error);
  } finally {
    service.listTicketFlows = original;
  }
});

test('getTicketFlow forwards error to next when service throws', async () => {
  const original = service.getTicketFlow;
  service.getTicketFlow = async () => { throw new Error('not found'); };

  const req = { params: { ticketId: '999' } };
  const res = createMockResponse();
  let caught = null;

  try {
    await controller.getTicketFlow(req, res, (err) => { caught = err; });
    assert.ok(caught instanceof Error);
  } finally {
    service.getTicketFlow = original;
  }
});

test('transitionTicketFlow forwards error to next when service throws', async () => {
  const original = service.transitionTicketFlow;
  service.transitionTicketFlow = async () => { throw new Error('invalid action'); };

  const req = { params: { ticketId: '1' }, body: { action: 'accept' }, session: {} };
  const res = createMockResponse();
  let caught = null;

  try {
    await controller.transitionTicketFlow(req, res, (err) => { caught = err; });
    assert.ok(caught instanceof Error);
  } finally {
    service.transitionTicketFlow = original;
  }
});
