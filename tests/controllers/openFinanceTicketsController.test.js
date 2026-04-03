const test = require('node:test');
const assert = require('node:assert');

const controller = require('../../src/controllers/openFinanceTicketsController');
const openFinanceTicketsService = require('../../src/services/openFinanceTicketsService');
const openFinanceTemplatesService = require('../../src/services/openFinanceTemplatesService');
const ticketStatusService = require('../../src/services/ticketStatusService');
const openFinanceAuthService = require('../../src/services/openFinanceAuthService');
const { createMockResponse } = require('../helpers/testHelpers');

// Proxy so existing test code can use service.xxx to mock individual services
const service = {
  get listTickets() { return openFinanceTicketsService.listTickets; },
  set listTickets(fn) { openFinanceTicketsService.listTickets = fn; },
  get listKnownTickets() { return openFinanceTicketsService.listKnownTickets; },
  set listKnownTickets(fn) { openFinanceTicketsService.listKnownTickets = fn; },
  get listTicketStatuses() { return ticketStatusService.listTicketStatuses; },
  set listTicketStatuses(fn) { ticketStatusService.listTicketStatuses = fn; },
  get getTicketById() { return openFinanceTicketsService.getTicketById; },
  set getTicketById(fn) { openFinanceTicketsService.getTicketById = fn; },
  get createTicket() { return openFinanceTicketsService.createTicket; },
  set createTicket(fn) { openFinanceTicketsService.createTicket = fn; },
  get updateTicket() { return openFinanceTicketsService.updateTicket; },
  set updateTicket(fn) { openFinanceTicketsService.updateTicket = fn; },
  get createTicketAttachment() { return openFinanceTicketsService.createTicketAttachment; },
  set createTicketAttachment(fn) { openFinanceTicketsService.createTicketAttachment = fn; },
  get createTicketActivity() { return openFinanceTicketsService.createTicketActivity; },
  set createTicketActivity(fn) { openFinanceTicketsService.createTicketActivity = fn; },
  get downloadTicketAttachment() { return openFinanceTicketsService.downloadTicketAttachment; },
  set downloadTicketAttachment(fn) { openFinanceTicketsService.downloadTicketAttachment = fn; },
  get listRequiredTemplateFields() { return openFinanceTemplatesService.listRequiredTemplateFields; },
  set listRequiredTemplateFields(fn) { openFinanceTemplatesService.listRequiredTemplateFields = fn; },
  get createSession() { return openFinanceAuthService.createSession; },
  set createSession(fn) { openFinanceAuthService.createSession = fn; },
};

test('listTickets reuses cookie and cache from session when headers are absent', async () => {
  const originalListTickets = service.listTickets;
  let captured = null;

  service.listTickets = async (query, headers) => {
    captured = { query, headers };
    return [];
  };

  const req = {
    query: {
      assignedGroup: '10',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(captured.headers.cookie, 'JSESSIONID=abc123');
  } finally {
    service.listTickets = originalListTickets;
  }
});

test('listTickets ignores cookie and cache headers from request and keeps managed session values', async () => {
  const originalListTickets = service.listTickets;
  let captured = null;

  service.listTickets = async (query, headers) => {
    captured = { query, headers };
    return [];
  };

  const req = {
    query: {},
    headers: {
      cookie: 'JSESSIONID=request-cookie',
      cache: 'request-cache',
      authorization: 'Bearer token',
    },
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=session-cookie',
        cache: 'session-cache',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(captured.headers.authorization, 'Bearer token');
    assert.strictEqual(captured.headers.cookie, 'JSESSIONID=session-cookie');
    assert.strictEqual(captured.headers.cache, 'session-cache');
  } finally {
    service.listTickets = originalListTickets;
  }
});

test('listTickets ignores local session cookie and still forwards upstream session cookie', async () => {
  const originalListTickets = service.listTickets;
  let captured = null;

  service.listTickets = async (query, headers) => {
    captured = { query, headers };
    return [];
  };

  const req = {
    query: {},
    headers: {
      cookie: 'open-finance.sid=local-session-id',
    },
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=upstream-cookie',
        cache: 'session-cache',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(captured.headers.cookie, 'JSESSIONID=upstream-cookie');
  } finally {
    service.listTickets = originalListTickets;
  }
});

test('listTickets creates external session automatically when none is stored', async () => {
  const originalCreateSession = service.createSession;
  const originalListTickets = service.listTickets;

  service.createSession = async () => ({
    response: {},
    sessionState: {
      cookie: 'JSESSIONID=auto-cookie',
      cache: 'auto-cache',
    },
  });

  service.listTickets = async () => [];

  const req = {
    query: {
      assignedGroup: '10',
    },
    headers: {},
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(req.session.openFinanceSession, {
      cookie: 'JSESSIONID=auto-cookie',
      cache: 'auto-cache',
    });
  } finally {
    service.createSession = originalCreateSession;
    service.listTickets = originalListTickets;
  }
});

test('listTickets refreshes external session automatically after upstream 401', async () => {
  const originalCreateSession = service.createSession;
  const originalListTickets = service.listTickets;
  const listTicketCalls = [];

  service.createSession = async () => ({
    response: {},
    sessionState: {
      cookie: 'JSESSIONID=renewed-cookie-1',
      cache: 'renewed-cache-1',
    },
  });

  service.listTickets = async (query, headers) => {
    listTicketCalls.push({ query, headers });

    if (listTicketCalls.length === 1) {
      const error = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }

    return [];
  };

  const req = {
    query: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=expired-cookie',
        cache: 'expired-cache',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(req.session.openFinanceSession.cookie, 'JSESSIONID=renewed-cookie-1');
  } finally {
    service.createSession = originalCreateSession;
    service.listTickets = originalListTickets;
  }
});

test('listTickets refreshes external session automatically after upstream captcha session error', async () => {
  const originalCreateSession = service.createSession;
  const originalListTickets = service.listTickets;
  const listTicketCalls = [];

  service.createSession = async () => ({
    response: {},
    sessionState: {
      cookie: 'JSESSIONID=renewed-cookie-2',
      cache: 'renewed-cache-2',
    },
  });

  service.listTickets = async (query, headers) => {
    listTicketCalls.push({ query, headers });

    if (listTicketCalls.length === 1) {
      const error = new Error('Open Finance upstream request failed.');
      error.status = 500;
      error.details = 'Wrong captcha';
      throw error;
    }

    return [];
  };

  const req = {
    query: {},
    headers: {
      cookie: 'JSESSIONID=request-cookie',
      cache: 'request-cache',
    },
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=expired-cookie',
        cache: 'expired-cache',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(req.session.openFinanceSession.cookie, 'JSESSIONID=renewed-cookie-2');
    assert.strictEqual(listTicketCalls.length, 2);
    assert.strictEqual(listTicketCalls[0].headers.cookie, 'JSESSIONID=expired-cookie');
    assert.strictEqual(listTicketCalls[1].headers.cookie, 'JSESSIONID=renewed-cookie-2');
  } finally {
    service.createSession = originalCreateSession;
    service.listTickets = originalListTickets;
  }
});

test('listTickets does not refresh session for generic upstream 500 error', async () => {
  const originalCreateSession = service.createSession;
  const originalListTickets = service.listTickets;
  const failure = new Error('Open Finance upstream request failed.');
  failure.status = 500;
  failure.details = 'Internal server error';
  let forwardedError = null;

  service.createSession = async () => ({
    response: {},
    sessionState: {
      cookie: 'JSESSIONID=renewed-cookie-3',
      cache: 'renewed-cache-3',
    },
  });

  service.listTickets = async () => {
    throw failure;
  };

  const req = {
    query: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=existing-cookie',
        cache: 'existing-cache',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.deepStrictEqual(req.session.openFinanceSession, {
      cookie: 'JSESSIONID=existing-cookie',
      cache: 'existing-cache',
    });
  } finally {
    service.createSession = originalCreateSession;
    service.listTickets = originalListTickets;
  }
});

test('listTickets forwards service errors to next without writing response', async () => {
  const originalListTickets = service.listTickets;
  const failure = new Error('Falha ao listar tickets.');
  let forwardedError = null;

  service.listTickets = async () => {
    throw failure;
  };

  const req = {
    query: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listTickets(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.listTickets = originalListTickets;
  }
});

test('listKnownTickets returns locally known tickets from service', async () => {
  const originalListKnownTickets = service.listKnownTickets;

  service.listKnownTickets = async () => [
    {
      ticket_id: '119681',
      current_owner_slug: 'consentimentos-outbound',
      current_stage: 'accepted_by_owner',
    },
  ];

  const req = {
    query: {
      ownerSlug: 'consentimentos-outbound',
    },
  };
  const res = createMockResponse();

  try {
    await controller.listKnownTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, [
      {
        ticket_id: '119681',
        current_owner_slug: 'consentimentos-outbound',
        current_stage: 'accepted_by_owner',
      },
    ]);
  } finally {
    service.listKnownTickets = originalListKnownTickets;
  }
});

test('listKnownTickets forwards empty query to service', async () => {
  const originalListKnownTickets = service.listKnownTickets;
  let capturedQuery = null;

  service.listKnownTickets = async (query) => {
    capturedQuery = query;
    return [];
  };

  const req = {
    query: {},
  };
  const res = createMockResponse();

  try {
    await controller.listKnownTickets(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(capturedQuery, {});
    assert.deepStrictEqual(res.body, []);
  } finally {
    service.listKnownTickets = originalListKnownTickets;
  }
});

test('listKnownTickets forwards service errors to next without writing response', async () => {
  const originalListKnownTickets = service.listKnownTickets;
  const failure = new Error('Falha ao listar tickets conhecidos.');
  let forwardedError = null;

  service.listKnownTickets = async () => {
    throw failure;
  };

  const req = {
    query: {
      ownerSlug: 'consentimentos-outbound',
    },
  };
  const res = createMockResponse();

  try {
    await controller.listKnownTickets(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.listKnownTickets = originalListKnownTickets;
  }
});

test('listTicketStatuses returns ticket statuses from service', async () => {
  const originalListTicketStatuses = service.listTicketStatuses;

  service.listTicketStatuses = async () => [
    { id: '1', name: 'NOVO' },
    { id: '8', name: 'EM ATENDIMENTO N2' },
  ];

  const req = {
    headers: {},
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.listTicketStatuses(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, [
      { id: '1', name: 'NOVO' },
      { id: '8', name: 'EM ATENDIMENTO N2' },
    ]);
  } finally {
    service.listTicketStatuses = originalListTicketStatuses;
  }
});

test('getTicketById returns ticket detail from service', async () => {
  const originalGetTicketById = service.getTicketById;

  service.getTicketById = async (ticketId) => ({
    ticket: {
      id: ticketId,
      title: 'Ticket detalhado',
    },
  });

  const req = {
    params: {
      ticketId: '119681',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.getTicketById(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.ticket.title, 'Ticket detalhado');
  } finally {
    service.getTicketById = originalGetTicketById;
  }
});

test('getTicketById forwards service errors to next without writing response', async () => {
  const originalGetTicketById = service.getTicketById;
  const failure = new Error('Falha ao consultar ticket.');
  let forwardedError = null;

  service.getTicketById = async () => {
    throw failure;
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.getTicketById(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.getTicketById = originalGetTicketById;
  }
});

test('createTicket forwards body and query to service and returns 201', async () => {
  const originalCreateTicket = service.createTicket;
  let captured = null;

  service.createTicket = async (body, query) => {
    captured = { body, query };
    return {
      id: '200001',
      created: true,
    };
  };

  const req = {
    body: {
      info: [{ key: 'title', value: 'Novo ticket' }],
    },
    query: {
      template: '20',
      type: '1',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicket(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(captured.query.template, '20');
  } finally {
    service.createTicket = originalCreateTicket;
  }
});

test('createTicket forwards empty body to service', async () => {
  const originalCreateTicket = service.createTicket;
  let captured = null;

  service.createTicket = async (body) => {
    captured = body;
    return { id: '200002' };
  };

  const req = {
    body: {},
    query: {
      template: '20',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicket(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(captured, {});
  } finally {
    service.createTicket = originalCreateTicket;
  }
});

test('createTicket forwards service errors to next without writing response', async () => {
  const originalCreateTicket = service.createTicket;
  const failure = new Error('Falha ao criar ticket.');
  let forwardedError = null;

  service.createTicket = async () => {
    throw failure;
  };

  const req = {
    body: {},
    query: {
      template: '20',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicket(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.createTicket = originalCreateTicket;
  }
});

test('updateTicket forwards body to service and returns updated ticket', async () => {
  const originalUpdateTicket = service.updateTicket;

  service.updateTicket = async (ticketId) => ({
    id: ticketId,
    updated: true,
  });

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {
      info: [{ key: 'status', value: 'Atualizado' }],
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.updateTicket(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.id, '119681');
  } finally {
    service.updateTicket = originalUpdateTicket;
  }
});

test('updateTicket forwards service errors to next without writing response', async () => {
  const originalUpdateTicket = service.updateTicket;
  const failure = new Error('Falha ao atualizar ticket.');
  let forwardedError = null;

  service.updateTicket = async () => {
    throw failure;
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.updateTicket(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.updateTicket = originalUpdateTicket;
  }
});

test('createTicketAttachment forwards uploaded file to service and returns 201', async () => {
  const originalCreateTicketAttachment = service.createTicketAttachment;

  service.createTicketAttachment = async (_ticketId, file) => ({
    attachmentId: '900',
    fileName: file.originalname,
  });

  const req = {
    params: {
      ticketId: '119681',
    },
    file: {
      originalname: 'evidencia.txt',
      size: 10,
      mimetype: 'text/plain',
      buffer: Buffer.from('conteudo'),
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicketAttachment(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.fileName, 'evidencia.txt');
  } finally {
    service.createTicketAttachment = originalCreateTicketAttachment;
  }
});

test('createTicketAttachment forwards missing file to service', async () => {
  const originalCreateTicketAttachment = service.createTicketAttachment;
  let captured = null;

  service.createTicketAttachment = async (ticketId, file) => {
    captured = { ticketId, file };
    return {
      attachmentId: null,
    };
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicketAttachment(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(captured.ticketId, '119681');
  } finally {
    service.createTicketAttachment = originalCreateTicketAttachment;
  }
});

test('createTicketAttachment forwards service errors to next without writing response', async () => {
  const originalCreateTicketAttachment = service.createTicketAttachment;
  const failure = new Error('Falha ao anexar arquivo.');
  let forwardedError = null;

  service.createTicketAttachment = async () => {
    throw failure;
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicketAttachment(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.createTicketAttachment = originalCreateTicketAttachment;
  }
});

test('createTicketActivity forwards body to service and returns 201', async () => {
  const originalCreateTicketActivity = service.createTicketActivity;

  service.createTicketActivity = async (ticketId, body) => ({
    id: '700',
    ticketId,
    description: body.description,
  });

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {
      userId: '10',
      fromTime: '2026-03-30T10:00:00Z',
      toTime: '2026-03-30T11:00:00Z',
      description: 'Atividade registrada',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicketActivity(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.ticketId, '119681');
  } finally {
    service.createTicketActivity = originalCreateTicketActivity;
  }
});

test('createTicketActivity forwards empty body to service', async () => {
  const originalCreateTicketActivity = service.createTicketActivity;
  let captured = null;

  service.createTicketActivity = async (ticketId, body) => {
    captured = { ticketId, body };
    return { id: '701' };
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicketActivity(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(captured.body, {});
  } finally {
    service.createTicketActivity = originalCreateTicketActivity;
  }
});

test('createTicketActivity forwards service errors to next without writing response', async () => {
  const originalCreateTicketActivity = service.createTicketActivity;
  const failure = new Error('Falha ao criar atividade.');
  let forwardedError = null;

  service.createTicketActivity = async () => {
    throw failure;
  };

  const req = {
    params: {
      ticketId: '119681',
    },
    body: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.createTicketActivity(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.createTicketActivity = originalCreateTicketActivity;
  }
});

test('downloadTicketAttachment sets response headers and sends binary payload', async () => {
  const originalDownloadTicketAttachment = service.downloadTicketAttachment;

  service.downloadTicketAttachment = async () => ({
    buffer: Buffer.from('arquivo'),
    headers: {
      contentType: 'text/plain',
      contentDisposition: 'attachment; filename="arquivo.txt"',
      contentLength: '7',
    },
  });

  const req = {
    params: {
      ticketId: '119681',
      fileId: '55',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.downloadTicketAttachment(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'text/plain');
    assert.deepStrictEqual(res.sent, Buffer.from('arquivo'));
  } finally {
    service.downloadTicketAttachment = originalDownloadTicketAttachment;
  }
});

test('downloadTicketAttachment forwards service errors to next without writing response', async () => {
  const originalDownloadTicketAttachment = service.downloadTicketAttachment;
  const failure = new Error('Falha ao baixar anexo.');
  let forwardedError = null;

  service.downloadTicketAttachment = async () => {
    throw failure;
  };

  const req = {
    params: {
      ticketId: '119681',
      fileId: '55',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.downloadTicketAttachment(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.downloadTicketAttachment = originalDownloadTicketAttachment;
  }
});

test('listRequiredTemplateFields returns template fields from service', async () => {
  const originalListRequiredTemplateFields = service.listRequiredTemplateFields;

  service.listRequiredTemplateFields = async () => ({
    required: [{ key: 'title' }],
  });

  const req = {
    params: {
      templateId: '20',
    },
    query: {
      type: 'incident',
      view: '1',
    },
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listRequiredTemplateFields(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.required[0].key, 'title');
  } finally {
    service.listRequiredTemplateFields = originalListRequiredTemplateFields;
  }
});

test('listRequiredTemplateFields forwards empty query to service', async () => {
  const originalListRequiredTemplateFields = service.listRequiredTemplateFields;
  let captured = null;

  service.listRequiredTemplateFields = async (templateId, query) => {
    captured = { templateId, query };
    return {
      required: [],
    };
  };

  const req = {
    params: {
      templateId: '20',
    },
    query: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listRequiredTemplateFields(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(captured.query, {});
  } finally {
    service.listRequiredTemplateFields = originalListRequiredTemplateFields;
  }
});

test('listRequiredTemplateFields forwards service errors to next without writing response', async () => {
  const originalListRequiredTemplateFields = service.listRequiredTemplateFields;
  const failure = new Error('Falha ao listar campos obrigatórios.');
  let forwardedError = null;

  service.listRequiredTemplateFields = async () => {
    throw failure;
  };

  const req = {
    params: {
      templateId: '20',
    },
    query: {},
    headers: {},
    session: {
      openFinanceSession: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cached-login-state',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listRequiredTemplateFields(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
  } finally {
    service.listRequiredTemplateFields = originalListRequiredTemplateFields;
  }
});
