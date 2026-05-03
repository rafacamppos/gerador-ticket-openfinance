const test = require('node:test');
const assert = require('node:assert');

const applicationIncidentsService = require('../../src/services/openFinanceApplicationIncidentsService');
const applicationIncidentRepository = require('../../src/repositories/applicationIncidentRepository');
const incidentTicketRepository = require('../../src/repositories/incidentTicketRepository');
const ticketOwnerRepository = require('../../src/repositories/ticketOwnerRepository');

test('reportApplicationIncident validates, resolves owner and persists incident', async () => {
  const originalGetActiveOwnerBySlug = ticketOwnerRepository.getActiveOwnerBySlug;
  const originalCreateIncident = applicationIncidentRepository.createIncident;

  ticketOwnerRepository.getActiveOwnerBySlug = async (slug) => ({
    id: 7,
    slug,
    name: 'Consentimentos Inbound',
  });

  applicationIncidentRepository.createIncident = async (payload) => ({
    id: 15,
    team_slug: 'consentimentos-inbound',
    team_name: 'Consentimentos Inbound',
    ...payload,
    created_at: '2026-03-29T10:20:00.000Z',
    updated_at: '2026-03-29T10:20:00.000Z',
  });

  try {
    const response = await applicationIncidentsService.reportApplicationIncident(
      'consentimentos-inbound',
      {
        x_fapi_interaction_id: '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3',
        authorization_server: '3c8c00be-f66b-4db2-a777-d833ee4d3d96',
        client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
        title: 'Falha ao processar consentimento',
        tipo_cliente: 'PF',
        canal_jornada: 'APP_TO_APP',
        endpoint: '/open-banking/consents/v3/consents',
        method: 'post',
        payload_request: { consentId: 'urn:abc' },
        payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
        occurred_at: '2026-03-29T10:15:00.000Z',
        http_status_code: 500,
        description: 'Erro ao processar consentimento',
        id_version_api: 3,
        category_data: {
          category_name: 'Conformidade',
          sub_category_name: 'Validação',
          third_level_category_name: 'Validação de Dados',
        },
      }
    );

    assert.deepStrictEqual(response, {
      id: '15',
      team_slug: 'consentimentos-inbound',
      team_name: 'Consentimentos Inbound',
      x_fapi_interaction_id: '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3',
      authorization_server: '3c8c00be-f66b-4db2-a777-d833ee4d3d96',
      client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
      title: 'Falha ao processar consentimento',
      tipo_cliente: 'PF',
      canal_jornada: 'App to app',
      endpoint: '/open-banking/consents/v3/consents',
      method: 'POST',
      payload_request: { consentId: 'urn:abc' },
      payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
      occurred_at: '2026-03-29T10:15:00.000Z',
      http_status_code: 500,
      description: 'Erro ao processar consentimento',
      id_version_api: '3',
      category_data: {
        category_name: 'Conformidade',
        sub_category_name: 'Validação',
        third_level_category_name: 'Validação de Dados',
      },
      ticket_context: null,
      incident_status: 'new',
      incident_status_label: 'Novo',
      related_ticket_id: null,
      assigned_to_user_id: null,
      assigned_to_name: null,
      assigned_to_email: null,
      created_at: '2026-03-29T10:20:00.000Z',
      updated_at: '2026-03-29T10:20:00.000Z',
    });
  } finally {
    ticketOwnerRepository.getActiveOwnerBySlug = originalGetActiveOwnerBySlug;
    applicationIncidentRepository.createIncident = originalCreateIncident;
  }
});

test('reportApplicationIncident rejects invalid payload fields', async () => {
  await assert.rejects(
    () =>
      applicationIncidentsService.reportApplicationIncident('', {
        x_fapi_interaction_id: 'not-a-uuid',
        authorization_server: 'also-not-a-uuid',
        client_id: 'invalid',
        endpoint: '',
        method: 'invalid',
        payload_request: null,
        payload_response: null,
        occurred_at: 'invalid-date',
        http_status_code: 999,
        description: '',
        category_data: {
          category_name: '',
          sub_category_name: '',
          third_level_category_name: '',
        },
      }),
    /teamSlug|x_fapi_interaction_id|authorization_server|client_id|endpoint|method|payload_request|payload_response|occurred_at|http_status_code|description|category_name|sub_category_name|third_level_category_name/i
  );
});

test('reportApplicationIncident requires id_version_api', async () => {
  const originalGetActiveOwnerBySlug = ticketOwnerRepository.getActiveOwnerBySlug;
  ticketOwnerRepository.getActiveOwnerBySlug = async (slug) => ({
    id: 7,
    slug,
    name: 'Consentimentos Inbound',
  });

  try {
    await assert.rejects(
      () =>
        applicationIncidentsService.reportApplicationIncident('consentimentos-inbound', {
          x_fapi_interaction_id: '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3',
          authorization_server: '3c8c00be-f66b-4db2-a777-d833ee4d3d96',
          client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
          title: 'Falha ao processar consentimento',
          tipo_cliente: 'PF',
          canal_jornada: 'APP_TO_APP',
          endpoint: '/open-banking/consents/v3/consents',
          method: 'POST',
          payload_request: {},
          payload_response: {},
          occurred_at: '2026-03-29T10:15:00.000Z',
          http_status_code: 500,
          description: 'Erro ao processar consentimento',
          category_data: {
            category_name: 'Conformidade',
            sub_category_name: 'Validação',
            third_level_category_name: 'Validação de Dados',
          },
        }),
      /id_version_api/i
    );
  } finally {
    ticketOwnerRepository.getActiveOwnerBySlug = originalGetActiveOwnerBySlug;
  }
});

test('listApplicationIncidents normalizes incidents by team', async () => {
  const originalListIncidentsByOwnerSlug = applicationIncidentRepository.listIncidentsByOwnerSlug;

  applicationIncidentRepository.listIncidentsByOwnerSlug = async () => [
    {
      id: 21,
      team_slug: 'consentimentos-inbound',
      team_name: 'Consentimentos Inbound',
      x_fapi_interaction_id: '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3',
      authorization_server: '3c8c00be-f66b-4db2-a777-d833ee4d3d96',
      client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
      endpoint: '/open-banking/consents/v3/consents',
      method: 'POST',
      payload_request: { consentId: 'urn:abc' },
      payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
      occurred_at: '2026-03-29T10:15:00.000Z',
      http_status_code: 500,
      description: 'Erro ao processar consentimento',
      incident_status: 'new',
      related_ticket_id: null,
      created_at: '2026-03-29T10:20:00.000Z',
      updated_at: '2026-03-29T10:20:00.000Z',
    },
  ];

  try {
    const response = await applicationIncidentsService.listApplicationIncidents(
      'consentimentos-inbound'
    );

    assert.strictEqual(response.length, 1);
    assert.strictEqual(response[0].id, '21');
    assert.strictEqual(response[0].team_slug, 'consentimentos-inbound');
    assert.strictEqual(response[0].method, 'POST');
    assert.strictEqual(response[0].incident_status, 'new');
    assert.strictEqual(response[0].incident_status_label, 'Novo');
    assert.strictEqual(response[0].assigned_to_name, null);
  } finally {
    applicationIncidentRepository.listIncidentsByOwnerSlug = originalListIncidentsByOwnerSlug;
  }
});

test('getApplicationIncidentById returns 404 when incident is not found', async () => {
  const originalGetIncidentTicketContext = incidentTicketRepository.getIncidentTicketContext;
  incidentTicketRepository.getIncidentTicketContext = async () => null;

  try {
    await assert.rejects(
      () =>
        applicationIncidentsService.getApplicationIncidentById(
          'consentimentos-inbound',
          '999'
        ),
      /Incidente não encontrado/i
    );
  } finally {
    incidentTicketRepository.getIncidentTicketContext = originalGetIncidentTicketContext;
  }
});

test('assignApplicationIncidentToUser assigns incident to authenticated user', async () => {
  const originalAssignIncidentToUser = applicationIncidentRepository.assignIncidentToUser;

  applicationIncidentRepository.assignIncidentToUser = async () => ({
    id: 33,
    team_slug: 'consentimentos-inbound',
    team_name: 'Consentimentos Inbound',
    endpoint: '/open-banking/consents/v3/consents',
    method: 'POST',
    payload_request: { consentId: 'urn:abc' },
    payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
    occurred_at: '2026-03-29T10:15:00.000Z',
    http_status_code: 500,
    description: 'Erro ao processar consentimento',
    incident_status: 'assigned',
    related_ticket_id: null,
    assigned_to_user_id: 10,
    assigned_to_name: 'Rafael de Campos',
    assigned_to_email: 'rafael.campos@f1rst.com.br',
    created_at: '2026-03-29T10:20:00.000Z',
    updated_at: '2026-03-29T10:30:00.000Z',
  });

  try {
    const response = await applicationIncidentsService.assignApplicationIncidentToUser(
      'consentimentos-inbound',
      '33',
      {
        assigned_to_user_id: 10,
        assigned_to_name: 'Rafael de Campos',
        assigned_to_email: 'rafael.campos@f1rst.com.br',
      }
    );

    assert.strictEqual(response.id, '33');
    assert.strictEqual(response.assigned_to_user_id, '10');
    assert.strictEqual(response.assigned_to_name, 'Rafael de Campos');
    assert.strictEqual(response.assigned_to_email, 'rafael.campos@f1rst.com.br');
    assert.strictEqual(response.incident_status, 'assigned');
    assert.strictEqual(response.incident_status_label, 'Atribuido');
  } finally {
    applicationIncidentRepository.assignIncidentToUser = originalAssignIncidentToUser;
  }
});

test('reportApplicationIncident throws 404 when owner is not found', async () => {
  const originalGetActiveOwnerBySlug = ticketOwnerRepository.getActiveOwnerBySlug;
  ticketOwnerRepository.getActiveOwnerBySlug = async () => null;

  try {
    await assert.rejects(
      () => applicationIncidentsService.reportApplicationIncident('slug-inexistente', {
        x_fapi_interaction_id: '7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3',
        authorization_server: '3c8c00be-f66b-4db2-a777-d833ee4d3d96',
        client_id: '96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3',
        title: 'Falha',
        tipo_cliente: 'PF',
        canal_jornada: 'APP_TO_APP',
        endpoint: '/open-banking/consents/v3/consents',
        method: 'POST',
        payload_request: {},
        payload_response: {},
        occurred_at: '2026-03-29T10:15:00.000Z',
        http_status_code: 500,
        description: 'desc',
        category_name: 'Conformidade',
        sub_category_name: 'Validação',
        third_level_category_name: 'Validação de Dados',
      }),
      /Equipe não encontrada/i
    );
  } finally {
    ticketOwnerRepository.getActiveOwnerBySlug = originalGetActiveOwnerBySlug;
  }
});

test('getApplicationIncidentById throws when incidentId is invalid', async () => {
  await assert.rejects(
    () => applicationIncidentsService.getApplicationIncidentById('consentimentos-inbound', 'abc'),
    /incidentId/i
  );
});

test('getApplicationIncidentById throws when incidentId is zero', async () => {
  await assert.rejects(
    () => applicationIncidentsService.getApplicationIncidentById('consentimentos-inbound', '0'),
    /incidentId/i
  );
});

test('assignApplicationIncidentToUser throws when incidentId is invalid', async () => {
  await assert.rejects(
    () => applicationIncidentsService.assignApplicationIncidentToUser('consentimentos-inbound', 'abc', { assigned_to_user_id: 1 }),
    /incidentId/i
  );
});

test('assignApplicationIncidentToUser throws when assigned_to_user_id is missing', async () => {
  await assert.rejects(
    () => applicationIncidentsService.assignApplicationIncidentToUser('consentimentos-inbound', '33', {}),
    /Usuário autenticado não encontrado/i
  );
});

test('assignApplicationIncidentToUser throws 404 when incident is not found', async () => {
  const originalAssignIncidentToUser = applicationIncidentRepository.assignIncidentToUser;
  applicationIncidentRepository.assignIncidentToUser = async () => null;

  try {
    await assert.rejects(
      () => applicationIncidentsService.assignApplicationIncidentToUser('consentimentos-inbound', '999', { assigned_to_user_id: 1 }),
      /Incidente não encontrado/i
    );
  } finally {
    applicationIncidentRepository.assignIncidentToUser = originalAssignIncidentToUser;
  }
});

test('transitionApplicationIncident throws when incidentId is invalid', async () => {
  await assert.rejects(
    () => applicationIncidentsService.transitionApplicationIncident('consentimentos-inbound', 'abc', { incident_status: 'monitoring' }),
    /incidentId/i
  );
});

test('transitionApplicationIncident throws when status is not allowed', async () => {
  await assert.rejects(
    () => applicationIncidentsService.transitionApplicationIncident('consentimentos-inbound', '33', { incident_status: 'invalido' }),
    /incident_status/i
  );
});

test('transitionApplicationIncident throws 404 when current incident is not found', async () => {
  const originalGetIncidentById = applicationIncidentRepository.getIncidentById;
  applicationIncidentRepository.getIncidentById = async () => null;

  try {
    await assert.rejects(
      () => applicationIncidentsService.transitionApplicationIncident('consentimentos-inbound', '999', { incident_status: 'monitoring' }),
      /Incidente não encontrado/i
    );
  } finally {
    applicationIncidentRepository.getIncidentById = originalGetIncidentById;
  }
});

test('transitionApplicationIncident requires related ticket when status is ticket_created', async () => {
  await assert.rejects(
    () =>
      applicationIncidentsService.transitionApplicationIncident(
        'consentimentos-inbound',
        '33',
        { incident_status: 'ticket_created' }
      ),
    /related_ticket_id/i
  );
});

test('transitionApplicationIncident updates status and related ticket', async () => {
  const originalGetIncidentById = applicationIncidentRepository.getIncidentById;
  const originalTransitionIncident = applicationIncidentRepository.transitionIncident;

  applicationIncidentRepository.getIncidentById = async () => ({
    id: 33,
    related_ticket_id: null,
  });

  applicationIncidentRepository.transitionIncident = async () => ({
    id: 33,
    team_slug: 'consentimentos-inbound',
    team_name: 'Consentimentos Inbound',
    endpoint: '/open-banking/consents/v3/consents',
    method: 'POST',
    payload_request: { consentId: 'urn:abc' },
    payload_response: { error: 'DETALHE_PGTO_INVALIDO' },
    occurred_at: '2026-03-29T10:15:00.000Z',
    http_status_code: 500,
    description: 'Erro ao processar consentimento',
    incident_status: 'ticket_created',
    related_ticket_id: 123456,
    assigned_to_user_id: 10,
    assigned_to_name: 'Rafael de Campos',
    assigned_to_email: 'rafael.campos@f1rst.com.br',
    created_at: '2026-03-29T10:20:00.000Z',
    updated_at: '2026-03-29T10:30:00.000Z',
  });

  try {
    const response = await applicationIncidentsService.transitionApplicationIncident(
      'consentimentos-inbound',
      '33',
      {
        incident_status: 'ticket_created',
        related_ticket_id: 123456,
      }
    );

    assert.strictEqual(response.incident_status, 'ticket_created');
    assert.strictEqual(response.incident_status_label, 'Ticket criado');
    assert.strictEqual(response.related_ticket_id, '123456');
  } finally {
    applicationIncidentRepository.getIncidentById = originalGetIncidentById;
    applicationIncidentRepository.transitionIncident = originalTransitionIncident;
  }
});
