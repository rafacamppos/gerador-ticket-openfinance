const test = require('node:test');
const assert = require('node:assert');

const controller = require('../../src/controllers/openFinanceApplicationIncidentsController');
const service = require('../../src/services/openFinanceApplicationIncidentsService');

function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('listApplicationIncidents returns incidents for the requested team', async () => {
  const originalListApplicationIncidents = service.listApplicationIncidents;

  service.listApplicationIncidents = async (teamSlug, _pagination) => [
    {
      id: '10',
      team_slug: teamSlug,
      incident_status: 'new',
    },
  ];

  const req = {
    params: { teamSlug: 'consentimentos-inbound' },
    session: {
      portalUser: {
        id: '7',
        email: 'operador@empresa.com',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.listApplicationIncidents(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, [
      {
        id: '10',
        team_slug: 'consentimentos-inbound',
        incident_status: 'new',
      },
    ]);
  } finally {
    service.listApplicationIncidents = originalListApplicationIncidents;
  }
});

test('listApplicationIncidents forwards service errors to next without writing response', async () => {
  const originalListApplicationIncidents = service.listApplicationIncidents;
  const failure = new Error('Falha ao listar incidentes.');
  let forwardedError = null;

  service.listApplicationIncidents = async () => {
    throw failure;
  };

  const req = {
    params: { teamSlug: 'consentimentos-inbound' },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.listApplicationIncidents(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.listApplicationIncidents = originalListApplicationIncidents;
  }
});

test('getApplicationIncidentById returns incident detail', async () => {
  const originalGetApplicationIncidentById = service.getApplicationIncidentById;

  service.getApplicationIncidentById = async (teamSlug, incidentId) => ({
    id: incidentId,
    team_slug: teamSlug,
    incident_status: 'assigned',
  });

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.getApplicationIncidentById(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body, {
      id: '33',
      team_slug: 'consentimentos-inbound',
      incident_status: 'assigned',
    });
  } finally {
    service.getApplicationIncidentById = originalGetApplicationIncidentById;
  }
});

test('getApplicationIncidentById forwards service errors to next without writing response', async () => {
  const originalGetApplicationIncidentById = service.getApplicationIncidentById;
  const failure = new Error('Falha ao consultar incidente.');
  let forwardedError = null;

  service.getApplicationIncidentById = async () => {
    throw failure;
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.getApplicationIncidentById(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.getApplicationIncidentById = originalGetApplicationIncidentById;
  }
});

test('reportIncident delegates payload creation and responds with 201', async () => {
  const originalReportApplicationIncident = service.reportApplicationIncident;
  let captured = null;

  service.reportApplicationIncident = async (teamSlug, payload) => {
    captured = { teamSlug, payload };
    return {
      id: '41',
      team_slug: teamSlug,
      endpoint: payload.endpoint,
      method: payload.method,
      http_status_code: payload.http_status_code,
    };
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
    },
    body: {
      client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
      endpoint: '/open-banking/consents/v3/consents',
      method: 'POST',
      http_status_code: 500,
    },
    session: {
      portalUser: {
        email: 'operador@empresa.com',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.reportIncident(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      payload: {
        client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
        endpoint: '/open-banking/consents/v3/consents',
        method: 'POST',
        http_status_code: 500,
      },
    });
    assert.deepStrictEqual(res.body, {
      id: '41',
      team_slug: 'consentimentos-inbound',
      endpoint: '/open-banking/consents/v3/consents',
      method: 'POST',
      http_status_code: 500,
    });
  } finally {
    service.reportApplicationIncident = originalReportApplicationIncident;
  }
});

test('reportIncident forwards empty body to service and preserves 201 response contract', async () => {
  const originalReportApplicationIncident = service.reportApplicationIncident;
  let captured = null;

  service.reportApplicationIncident = async (teamSlug, payload) => {
    captured = { teamSlug, payload };
    return {
      id: '42',
      team_slug: teamSlug,
      accepted_empty_payload: true,
    };
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
    },
    body: {},
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.reportIncident(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 201);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      payload: {},
    });
    assert.deepStrictEqual(res.body, {
      id: '42',
      team_slug: 'consentimentos-inbound',
      accepted_empty_payload: true,
    });
  } finally {
    service.reportApplicationIncident = originalReportApplicationIncident;
  }
});

test('assignIncidentToMe injects the authenticated user into service payload', async () => {
  const originalAssignApplicationIncidentToUser = service.assignApplicationIncidentToUser;
  let captured = null;

  service.assignApplicationIncidentToUser = async (teamSlug, incidentId, payload) => {
    captured = { teamSlug, incidentId, payload };
    return {
      id: incidentId,
      team_slug: teamSlug,
      assigned_to_user_id: payload.assigned_to_user_id,
    };
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    session: {
      portalUser: {
        id: '10',
        name: 'Rafael de Campos',
        email: 'rafael.campos@f1rst.com.br',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.assignIncidentToMe(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
      payload: {
        assigned_to_user_id: '10',
      },
    });
    assert.deepStrictEqual(res.body, {
      id: '33',
      team_slug: 'consentimentos-inbound',
      assigned_to_user_id: '10',
    });
  } finally {
    service.assignApplicationIncidentToUser = originalAssignApplicationIncidentToUser;
  }
});

test('assignIncidentToMe forwards null user id when session is absent', async () => {
  const originalAssignApplicationIncidentToUser = service.assignApplicationIncidentToUser;
  let captured = null;

  service.assignApplicationIncidentToUser = async (teamSlug, incidentId, payload) => {
    captured = { teamSlug, incidentId, payload };
    return {
      id: incidentId,
      team_slug: teamSlug,
      assigned_to_user_id: payload.assigned_to_user_id,
    };
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.assignIncidentToMe(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
      payload: {
        assigned_to_user_id: null,
      },
    });
    assert.deepStrictEqual(res.body, {
      id: '33',
      team_slug: 'consentimentos-inbound',
      assigned_to_user_id: null,
    });
  } finally {
    service.assignApplicationIncidentToUser = originalAssignApplicationIncidentToUser;
  }
});

test('assignIncidentToMe forwards only user id in payload', async () => {
  const originalAssignApplicationIncidentToUser = service.assignApplicationIncidentToUser;
  let captured = null;

  service.assignApplicationIncidentToUser = async (teamSlug, incidentId, payload) => {
    captured = { teamSlug, incidentId, payload };
    return payload;
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    session: {
      portalUser: {
        id: '10',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.assignIncidentToMe(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
      payload: {
        assigned_to_user_id: '10',
      },
    });
    assert.deepStrictEqual(res.body, {
      assigned_to_user_id: '10',
    });
  } finally {
    service.assignApplicationIncidentToUser = originalAssignApplicationIncidentToUser;
  }
});

test('assignIncidentToMe forwards service errors to next without writing response', async () => {
  const originalAssignApplicationIncidentToUser = service.assignApplicationIncidentToUser;
  const failure = new Error('Falha ao atribuir incidente.');
  let forwardedError = null;

  service.assignApplicationIncidentToUser = async () => {
    throw failure;
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    session: {
      portalUser: {
        id: '10',
        name: 'Rafael de Campos',
        email: 'rafael.campos@f1rst.com.br',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.assignIncidentToMe(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.assignApplicationIncidentToUser = originalAssignApplicationIncidentToUser;
  }
});

test('transitionIncident forwards transition payload as received', async () => {
  const originalTransitionApplicationIncident = service.transitionApplicationIncident;
  let captured = null;

  service.transitionApplicationIncident = async (teamSlug, incidentId, payload) => {
    captured = { teamSlug, incidentId, payload };
    return {
      id: incidentId,
      team_slug: teamSlug,
      incident_status: payload.incident_status,
      related_ticket_id: String(payload.related_ticket_id),
    };
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    body: {
      incident_status: 'ticket_created',
      related_ticket_id: 123456,
    },
    session: {
      portalUser: {
        id: '10',
        email: 'rafael.campos@f1rst.com.br',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.transitionIncident(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
      payload: {
        incident_status: 'ticket_created',
        related_ticket_id: 123456,
      },
    });
    assert.deepStrictEqual(res.body, {
      id: '33',
      team_slug: 'consentimentos-inbound',
      incident_status: 'ticket_created',
      related_ticket_id: '123456',
    });
  } finally {
    service.transitionApplicationIncident = originalTransitionApplicationIncident;
  }
});

test('transitionIncident forwards empty body to service', async () => {
  const originalTransitionApplicationIncident = service.transitionApplicationIncident;
  let captured = null;

  service.transitionApplicationIncident = async (teamSlug, incidentId, payload) => {
    captured = { teamSlug, incidentId, payload };
    return {
      id: incidentId,
      team_slug: teamSlug,
      incident_status: null,
      related_ticket_id: null,
    };
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    body: {},
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.transitionIncident(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(captured, {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
      payload: {},
    });
    assert.deepStrictEqual(res.body, {
      id: '33',
      team_slug: 'consentimentos-inbound',
      incident_status: null,
      related_ticket_id: null,
    });
  } finally {
    service.transitionApplicationIncident = originalTransitionApplicationIncident;
  }
});

test('transitionIncident forwards service errors to next without writing response', async () => {
  const originalTransitionApplicationIncident = service.transitionApplicationIncident;
  const failure = new Error('Falha ao transicionar incidente.');
  let forwardedError = null;

  service.transitionApplicationIncident = async () => {
    throw failure;
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
      incidentId: '33',
    },
    body: {
      incident_status: 'ticket_created',
      related_ticket_id: 123456,
    },
    session: {
      portalUser: {
        id: '10',
        email: 'rafael.campos@f1rst.com.br',
      },
    },
  };
  const res = createMockResponse();

  try {
    await controller.transitionIncident(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.transitionApplicationIncident = originalTransitionApplicationIncident;
  }
});

test('reportIncident forwards service errors to next', async () => {
  const originalReportApplicationIncident = service.reportApplicationIncident;
  const failure = new Error('Falha ao registrar incidente.');
  let forwardedError = null;

  service.reportApplicationIncident = async () => {
    throw failure;
  };

  const req = {
    params: {
      teamSlug: 'consentimentos-inbound',
    },
    body: {},
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.reportIncident(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.reportApplicationIncident = originalReportApplicationIncident;
  }
});
