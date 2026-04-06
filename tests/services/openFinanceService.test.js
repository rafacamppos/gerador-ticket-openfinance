const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const client = require('../../src/clients/openFinanceDeskClient');
const { openFinancePassword, openFinanceUsername } = require('../../src/config/env');
const service = require('../../src/services/openFinanceService');
const ticketOwnerClassificationService = require('../../src/services/ticketOwnerClassificationService');
const ticketFlowService = require('../../src/services/ticketFlowService');

test('createSession validates payload and normalizes user_name for upstream', async () => {
  const originalPostJsonWithMeta = client.postJsonWithMeta;
  let captured = null;

  client.postJsonWithMeta = async (path, body) => {
    captured = { path, body };
    return {
      payload: {
        cache: 'session-cache-token',
        version: 'v24.4.60',
        language: 'pt',
        dateTimeFormat: 'dd-MM-yyyy HH:mm',
        userId: '4867',
        userName: 'Open Finance Santander',
        loginName: 'atendimento-open-finance@santander.com.br',
        email: 'atendimento-open-finance@santander.com.br',
        companyName: 'BCO SANTANDER (BRASIL) S.A.',
        roleType: 'Administrador',
        isAdmin: true,
        isManager: true,
        isSysAidAdmin: false,
        isGuest: false,
        isActive: true,
        isIntegrationUser: true,
        groups: [
          {
            name: 'N2_Santander',
            supportLevel: 2,
          },
        ],
        groupPermissionsEnabled: true,
        timezone: 'Etc/GMT+3',
        locale: 'pt_BR',
        emailNotificationsEnabled: true,
        lastLogin: '2026-03-24 21:34:50.56',
        loginSource: '3',
        accountId: 'obkbrasil',
      },
      headers: {
        setCookie: ['JSESSIONID=abc123; Path=/; HttpOnly'],
        cookie: [],
        cache: null,
      },
    };
  };

  try {
    const response = await service.createSession({
      userName: ' api.user ',
      password: 'secret',
    });

    assert.deepStrictEqual(response, {
      response: {
        sistema: {
          versao: 'v24.4.60',
          idioma: 'pt',
          formato_data: 'dd-MM-yyyy HH:mm',
        },
        usuario: {
          id: '4867',
          nome: 'Open Finance Santander',
          login: 'atendimento-open-finance@santander.com.br',
          email: 'atendimento-open-finance@santander.com.br',
          empresa: 'BCO SANTANDER (BRASIL) S.A.',
          perfil: {
            tipo: 'Administrador',
            isAdmin: true,
            isManager: true,
            isSysAidAdmin: false,
            isGuest: false,
            ativo: true,
            usuario_integracao: true,
          },
          acesso: {
            grupos: [
              {
                nome: 'N2_Santander',
                nivel_suporte: 2,
              },
            ],
            permissoes_por_grupo: true,
          },
          configuracoes: {
            timezone: 'Etc/GMT+3',
            locale: 'pt_BR',
            notificacoes_email: true,
          },
          auditoria: {
            ultimo_login: '2026-03-24 21:34:50.56',
            login_source: '3',
          },
        },
        sessao: {
          account_id: 'obkbrasil',
          cookie_presente: true,
        },
      },
      sessionState: {
        cookie: 'JSESSIONID=abc123; Path=/; HttpOnly',
        cache: 'session-cache-token',
      },
    });
    assert.deepStrictEqual(captured, {
      path: '/login',
      body: {
        user_name: 'api.user',
        password: 'secret',
      },
    });
  } finally {
    client.postJsonWithMeta = originalPostJsonWithMeta;
  }
});

test('createSession formats nested upstream login payloads into the public contract', async () => {
  const originalPostJsonWithMeta = client.postJsonWithMeta;

  client.postJsonWithMeta = async () => ({
    payload: {
      language: 'pt',
      account_id: 'obkbrasil',
      session: {
        version: 'v24.4.60',
        preferences: {
          dateFormat: 'dd-MM-yyyy HH:mm',
          timezone: 'Etc/GMT+3',
          locale: 'pt_BR',
          emailNotifications: true,
        },
      },
      user: {
        user_id: '4867',
        fullName: 'Open Finance Santander',
        emailAddress: 'atendimento-open-finance@santander.com.br',
        company: 'BCO SANTANDER (BRASIL) S.A.',
        roleName: 'Administrador',
        active: true,
        integrationUser: true,
        admin: true,
        manager: true,
        sysaidAdmin: false,
        guest: false,
        audit: {
          last_login: '2026-03-24 21:34:50.56',
          login_source: '3',
        },
      },
      supportGroups: [
        {
          group_name: 'N2_Santander',
          support_level: 2,
        },
      ],
      permissions: {
        groupPermissionsEnabled: true,
      },
    },
    headers: {
      setCookie: ['JSESSIONID=abc123; Path=/; HttpOnly'],
      cookie: [],
      cache: null,
    },
  });

  try {
    const response = await service.createSession({
      userName: 'api.user',
      password: 'secret',
    });

    assert.deepStrictEqual(response.response, {
      sistema: {
        versao: 'v24.4.60',
        idioma: 'pt',
        formato_data: 'dd-MM-yyyy HH:mm',
      },
      usuario: {
        id: '4867',
        nome: 'Open Finance Santander',
        login: 'atendimento-open-finance@santander.com.br',
        email: 'atendimento-open-finance@santander.com.br',
        empresa: 'BCO SANTANDER (BRASIL) S.A.',
        perfil: {
          tipo: 'Administrador',
          isAdmin: true,
          isManager: true,
          isSysAidAdmin: false,
          isGuest: false,
          ativo: true,
          usuario_integracao: true,
        },
        acesso: {
          grupos: [
            {
              nome: 'N2_Santander',
              nivel_suporte: 2,
            },
          ],
          permissoes_por_grupo: true,
        },
        configuracoes: {
          timezone: 'Etc/GMT+3',
          locale: 'pt_BR',
          notificacoes_email: true,
        },
        auditoria: {
          ultimo_login: '2026-03-24 21:34:50.56',
          login_source: '3',
        },
      },
      sessao: {
        account_id: 'obkbrasil',
        cookie_presente: true,
      },
    });
  } finally {
    client.postJsonWithMeta = originalPostJsonWithMeta;
  }
});

test('createSession formats key-value style upstream login payloads into the public contract', async () => {
  const originalPostJsonWithMeta = client.postJsonWithMeta;

  client.postJsonWithMeta = async () => ({
    payload: {
      info: [
        { key: 'version', value: 'v24.4.60' },
        { key: 'language', value: 'pt' },
        { key: 'dateFormat', value: 'dd-MM-yyyy HH:mm' },
        { key: 'user_id', value: '4867' },
        { key: 'user_name', value: 'Open Finance Santander' },
        { key: 'user_email', value: 'atendimento-open-finance@santander.com.br' },
        { key: 'company_name', value: 'BCO SANTANDER (BRASIL) S.A.' },
        { key: 'role_type', value: 'Administrador' },
        { key: 'isAdmin', value: 'true' },
        { key: 'isManager', value: 'true' },
        { key: 'isSysAidAdmin', value: 'false' },
        { key: 'isGuest', value: 'false' },
        { key: 'isActive', value: 'true' },
        { key: 'isIntegrationUser', value: 'true' },
        { key: 'groupPermissionsEnabled', value: 'true' },
        { key: 'timezone', value: 'Etc/GMT+3' },
        { key: 'locale', value: 'pt_BR' },
        { key: 'emailNotificationsEnabled', value: 'true' },
        { key: 'last_login', value: '2026-03-24 21:34:50.56' },
        { key: 'login_source', value: '3' },
        { key: 'account_id', value: 'obkbrasil' },
      ],
      groups: [
        {
          name: 'N2_Santander',
          supportLevel: 2,
        },
      ],
    },
    headers: {
      setCookie: ['JSESSIONID=abc123; Path=/; HttpOnly'],
      cookie: [],
      cache: null,
    },
  });

  try {
    const response = await service.createSession({
      userName: 'api.user',
      password: 'secret',
    });

    assert.deepStrictEqual(response.response, {
      sistema: {
        versao: 'v24.4.60',
        idioma: 'pt',
        formato_data: 'dd-MM-yyyy HH:mm',
      },
      usuario: {
        id: '4867',
        nome: 'Open Finance Santander',
        login: 'atendimento-open-finance@santander.com.br',
        email: 'atendimento-open-finance@santander.com.br',
        empresa: 'BCO SANTANDER (BRASIL) S.A.',
        perfil: {
          tipo: 'Administrador',
          isAdmin: true,
          isManager: true,
          isSysAidAdmin: false,
          isGuest: false,
          ativo: true,
          usuario_integracao: true,
        },
        acesso: {
          grupos: [
            {
              nome: 'N2_Santander',
              nivel_suporte: 2,
            },
          ],
          permissoes_por_grupo: true,
        },
        configuracoes: {
          timezone: 'Etc/GMT+3',
          locale: 'pt_BR',
          notificacoes_email: true,
        },
        auditoria: {
          ultimo_login: '2026-03-24 21:34:50.56',
          login_source: '3',
        },
      },
      sessao: {
        account_id: 'obkbrasil',
        cookie_presente: true,
      },
    });
  } finally {
    client.postJsonWithMeta = originalPostJsonWithMeta;
  }
});

test('createSession formats the real upstream login payload into the expected public contract', async () => {
  const originalPostJsonWithMeta = client.postJsonWithMeta;

  client.postJsonWithMeta = async () => ({
    payload: {
      language: 'pt',
      sysaid_version: 'v24.4.60',
      date_format: 'dd-MM-yyyy HH:mm',
      user: {
        id: '4867',
        name: 'atendimento-open-finance@santander.com.br',
        isAdmin: true,
        isSysAidAdmin: false,
        isManager: true,
        isGuest: false,
        info: [
          { key: 'user_type', value: 'Administrador', valueCaption: 'Administrador' },
          { key: 'CustomColumn94user', value: '1', valueCaption: '1' },
          { key: 'permissions_by_groups', value: 'Y', valueCaption: 'Y' },
          {
            key: 'login_user',
            value: 'atendimento-open-finance@santander.com.br',
            valueCaption: 'atendimento-open-finance@santander.com.br',
          },
          { key: 'email_notifications', value: 'true', valueCaption: 'true' },
          {
            key: 'user_groups',
            value: [
              {
                id: 70,
                name: 'N2_Santander',
                type: 1,
                supportLevel: 2,
                visible: true,
              },
            ],
          },
          { key: 'timezone', value: 'Etc/GMT+3', valueCaption: 'Etc/GMT+3' },
          { key: 'CustomColumn143user', value: '2026-03-24 21:34:50.56', valueCaption: '2026-03-24 21:34:50.56' },
          { key: 'locale', value: 'pt_BR', valueCaption: 'pt_BR' },
          { key: 'calculated_user_name', value: 'Open Finance Santander', valueCaption: 'Open Finance Santander' },
          { key: 'company', value: '56', valueCaption: 'BCO SANTANDER (BRASIL) S.A.' },
          { key: 'first_name', value: 'Open Finance Santander', valueCaption: 'Open Finance Santander' },
          { key: 'email_address', value: 'atendimento-open-finance@santander.com.br', valueCaption: 'atendimento-open-finance@santander.com.br' },
          { key: 'CustomColumn144user', value: '3', valueCaption: '3' },
          { key: 'disable', value: 'N', valueCaption: 'N' },
        ],
      },
      thirdCategoryEnabled: true,
      accountId: 'obkbrasil',
    },
    headers: {
      setCookie: ['JSESSIONID=abc123; Path=/; HttpOnly'],
      cookie: [],
      cache: null,
    },
  });

  try {
    const response = await service.createSession({
      userName: 'api.user',
      password: 'secret',
    });

    assert.deepStrictEqual(response.response, {
      sistema: {
        versao: 'v24.4.60',
        idioma: 'pt',
        formato_data: 'dd-MM-yyyy HH:mm',
      },
      usuario: {
        id: '4867',
        nome: 'Open Finance Santander',
        login: 'atendimento-open-finance@santander.com.br',
        email: 'atendimento-open-finance@santander.com.br',
        empresa: 'BCO SANTANDER (BRASIL) S.A.',
        perfil: {
          tipo: 'Administrador',
          isAdmin: true,
          isManager: true,
          isSysAidAdmin: false,
          isGuest: false,
          ativo: true,
          usuario_integracao: true,
        },
        acesso: {
          grupos: [
            {
              nome: 'N2_Santander',
              nivel_suporte: 2,
            },
          ],
          permissoes_por_grupo: true,
        },
        configuracoes: {
          timezone: 'Etc/GMT+3',
          locale: 'pt_BR',
          notificacoes_email: true,
        },
        auditoria: {
          ultimo_login: '2026-03-24 21:34:50.56',
          login_source: '3',
        },
      },
      sessao: {
        account_id: 'obkbrasil',
        cookie_presente: true,
      },
    });
  } finally {
    client.postJsonWithMeta = originalPostJsonWithMeta;
  }
});

test('createSession uses backend configured credentials when payload is empty', async () => {
  const originalPostJsonWithMeta = client.postJsonWithMeta;
  let captured = null;

  client.postJsonWithMeta = async (path, body) => {
    captured = { path, body };
    return {
      payload: {},
      headers: {
        setCookie: ['JSESSIONID=abc123; Path=/; HttpOnly'],
        cookie: [],
        cache: null,
      },
    };
  };

  try {
    await service.createSession({});

    assert.deepStrictEqual(captured, {
      path: '/login',
      body: {
        user_name: openFinanceUsername,
        password: openFinancePassword,
      },
    });
  } finally {
    client.postJsonWithMeta = originalPostJsonWithMeta;
  }
});

test('createSession rejects missing configured credentials when payload is empty', async () => {
  const envModulePath = path.resolve(
    __dirname,
    '../../src/config/env.js'
  );
  const serviceModulePath = path.resolve(
    __dirname,
    '../../src/services/openFinanceService.js'
  );
  const authServiceModulePath = path.resolve(
    __dirname,
    '../../src/services/openFinanceAuthService.js'
  );

  const originalEnvModule = require.cache[envModulePath];
  const originalServiceModule = require.cache[serviceModulePath];
  const originalAuthServiceModule = require.cache[authServiceModulePath];

  delete require.cache[envModulePath];
  delete require.cache[serviceModulePath];
  delete require.cache[authServiceModulePath];

  require.cache[envModulePath] = {
    id: envModulePath,
    filename: envModulePath,
    loaded: true,
    exports: {
      ...require('../../src/config/env'),
      openFinanceUsername: '',
      openFinancePassword: '',
    },
  };

  try {
    const isolatedService = require('../../src/services/openFinanceService');
    await assert.rejects(
      () => isolatedService.createSession({}),
      (error) =>
        error.message === 'Open Finance username is not configured.' && error.status === 400
    );
  } finally {
    delete require.cache[serviceModulePath];
    delete require.cache[authServiceModulePath];
    delete require.cache[envModulePath];

    if (originalEnvModule) {
      require.cache[envModulePath] = originalEnvModule;
    }

    if (originalServiceModule) {
      require.cache[serviceModulePath] = originalServiceModule;
    }

    if (originalAuthServiceModule) {
      require.cache[authServiceModulePath] = originalAuthServiceModule;
    }
  }
});

test('listTickets normalizes filter query names', async () => {
  const originalGetJson = client.getJson;
  const originalClassifyTickets = ticketOwnerClassificationService.classifyTickets;
  const originalSyncTicketFlows = ticketFlowService.syncTicketFlows;
  const originalAttachFlowStates = ticketFlowService.attachFlowStates;
  let captured = null;

  ticketOwnerClassificationService.classifyTickets = async (tickets) =>
    tickets.map((ticket) => ({
      ...ticket,
      routing: {
        owner_slug: 'su-super-usuarios',
        owner_name: 'SU (Super Usuário)',
        resolution_type: 'classification_unavailable',
        matched_rule_group: null,
      },
    }));
  ticketFlowService.syncTicketFlows = async () => [];
  ticketFlowService.attachFlowStates = async (tickets) => tickets.map((t) => ({ ...t, flow: null }));

  client.getJson = async (path, query, headers) => {
    captured = { path, query, headers };
    return [
      {
        id: '166933',
        info: [
          { key: 'title', value: 'Dados de Conta Não Estão Sendo Enviados' },
          { key: 'description', value: 'Erro ao coletar dados de conta para consentimento' },
          { key: 'status', value: 'ATENDIMENTO ENCERRADO' },
          { key: 'type', value: '1' },
          { key: 'template', value: '20' },
          { key: 'sr_type', value: 'Incidente' },
          { key: 'problem_type', value: 'Erro na Jornada ou Dados' },
          { key: 'problem_sub_type', value: 'Trabalhando os Dados' },
          { key: 'third_level_category', value: 'Tipo F V3' },
          {
            key: 'CustomColumn68sr',
            value:
              'https://trust-openbanking.api.santander.com.br/open-banking/consents/v3/consents/...'
          },
          { key: 'CustomColumn70sr', value: '2XX' },
          { key: 'CustomColumn156sr', value: '2c82f744-af39-4cac-8233-ebc772484f78' },
          { key: 'CustomColumn69sr', value: '{"headers":{},"payload":{}}' },
          { key: 'CustomColumn71sr', value: '{"headers":{},"payload":{}}' },
          { key: 'CustomColumn171sr', value: '10 Dias' },
          { key: 'CustomColumn170sr', value: '7 Dias' },
          { key: 'CustomColumn33sr', value: 'Fora do SLA' },
          { key: 'request_user', value: 'Engenharia Belvo' },
          { key: 'CustomColumn155sr', value: 'Belvo' },
          { key: 'responsibility', value: 'Daniel Vieira Ferreira' },
          { key: 'assigned_group', value: 'N2_Santander' },
          { key: 'current_support_level', value: '2' },
          { key: 'CustomColumn119sr', value: 'Erro de Desconformidade' },
          { key: 'CustomColumn129sr', value: '1' },
          { key: 'CustomColumn164sr', value: '1' },
          { key: 'CustomColumn172sr', value: 'true' },
          { key: 'CustomColumn120sr', value: '1;2' },
          { key: 'solution', value: 'Correção no processamento do ingestor de eventos' },
          { key: 'workaround', value: null },
          { key: 'insert_time', value: '1772109147000' },
          { key: 'update_time', value: '1774261975000' },
          { key: 'close_time', value: '1774261975000' },
          { key: 'due_date', value: '1773356399000' },
          { key: 'reopen_counter', value: '2' },
          { key: 'archive', value: '0' },
          { key: 'notes', value: [{ userName: 'Rafael', createDate: 1772109147000, text: 'Nota' }] },
          { key: 'activities', value: [{ id: 10, userName: 'N2', description: 'Atividade', logTime: 1772109147000, type: 'Incident changed' }] },
          { key: 'attachments', value: [{ id: 30, name: 'evidencia.txt', contentType: 'text/plain', size: 50, createDate: 1772109147000 }] },
        ],
      },
    ];
  };

  try {
    const response = await service.listTickets(
      {
        assignedGroup: '10',
        problemType: 'Incidentes_APIs_Erros',
        status: '4',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(response, [
      {
        ticket: {
          id: '166933',
          title: 'Dados de Conta Não Estão Sendo Enviados',
          description: {
            summary: 'Erro ao coletar dados de conta para consentimento',
            full: 'Erro ao coletar dados de conta para consentimento',
          },
          status: 'ATENDIMENTO ENCERRADO',
          type: '1',
          sr_type: 'Incidente',
          template: '20',
          category: {
            nivel1: 'Erro na Jornada ou Dados',
            nivel2: 'Trabalhando os Dados',
            nivel3: 'Tipo F V3',
          },
        },
        api_context: {
          endpoint: 'https://trust-openbanking.api.santander.com.br/open-banking/consents/v3/consents/...',
          http_status: '2XX',
          interaction_id: '2c82f744-af39-4cac-8233-ebc772484f78',
          request: {
            headers: {},
            payload: {},
          },
          response: {
            headers: {},
            payload: {},
          },
        },
        sla: {
          sla_dias: '10 Dias',
          sla_atraso: '7 Dias',
          status: 'Fora do SLA',
          due_date: new Date(1773356399000).toISOString(),
          due_date_ms: 1773356399000,
        },
        assignment: {
          solicitante: 'Engenharia Belvo',
          instituicao_requerente: 'Belvo',
          responsavel: 'Daniel Vieira Ferreira',
          grupo: 'N2_Santander',
          nivel_suporte_atual: '2',
        },
        analysis: {
          erro_tipo: 'Erro de Desconformidade',
          procedente: true,
          escopo: 'Bilateral',
          monitoramento: true,
          tipo_cliente: ['PF', 'PJ'],
        },
        solution: {
          descricao: 'Correção no processamento do ingestor de eventos',
          workaround: null,
          data_prevista_implementacao: null,
          data_prevista_implementacao_ms: null,
        },
        timestamps: {
          criado_em: new Date(1772109147000).toISOString(),
          criado_em_ms: 1772109147000,
          atualizado_em: new Date(1774261975000).toISOString(),
          atualizado_em_ms: 1774261975000,
          encerrado_em: new Date(1774261975000).toISOString(),
          encerrado_em_ms: 1774261975000,
        },
        lifecycle: {
          reopen_counter: '2',
          archived: false,
        },
        notes: [
          {
            user_name: 'Rafael',
            create_date: new Date(1772109147000).toISOString(),
            create_date_ms: 1772109147000,
            text: 'Nota',
          },
        ],
        activities: [
          {
            id: 10,
            user_name: 'N2',
            description: 'Atividade',
            logged_at: new Date(1772109147000).toISOString(),
            logged_at_ms: 1772109147000,
            type: 'Incident changed',
          },
        ],
        attachments: [
          {
            id: 30,
            file_id: 30,
            file_name: 'evidencia.txt',
            real_file_name: null,
            file_date: new Date(1772109147000).toISOString(),
            ticket_id: '166933',
            download_url:
              'https://servicedesk.openfinancebrasil.org.br/getFile?table=service_req&id=166933&getFile=30',
            name: 'evidencia.txt',
            content_type: 'text/plain',
            size: 50,
            created_at: new Date(1772109147000).toISOString(),
            created_at_ms: 1772109147000,
          },
        ],
        raw_fields: [
          {
            key: 'CustomColumn68sr',
            label: 'CustomColumn68sr',
            value: 'https://trust-openbanking.api.santander.com.br/open-banking/consents/v3/consents/...',
          },
          {
            key: 'CustomColumn70sr',
            label: 'CustomColumn70sr',
            value: '2XX',
          },
          {
            key: 'CustomColumn156sr',
            label: 'CustomColumn156sr',
            value: '2c82f744-af39-4cac-8233-ebc772484f78',
          },
        ],
        routing: {
          owner_slug: 'su-super-usuarios',
          owner_name: 'SU (Super Usuário)',
          resolution_type: 'classification_unavailable',
          matched_rule_group: null,
        },
        flow: null,
      },
    ]);
    assert.deepStrictEqual(captured, {
      path: '/sr',
      query: {
        assigned_group: '10',
        problem_type: 'Incidentes_APIs_Erros',
      },
      headers: {
        authorization: 'Bearer token',
      },
    });
  } finally {
    client.getJson = originalGetJson;
    ticketOwnerClassificationService.classifyTickets = originalClassifyTickets;
    ticketFlowService.syncTicketFlows = originalSyncTicketFlows;
    ticketFlowService.attachFlowStates = originalAttachFlowStates;
  }
});

test('listTickets removes status filter when status id maps to TODOS', async () => {
  const originalGetJson = client.getJson;
  let captured = null;

  client.getJson = async (path, query, headers) => {
    captured = { path, query, headers };
    return [];
  };

  try {
    const response = await service.listTickets(
      {
        status: '33',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(response, []);
    assert.deepStrictEqual(captured, {
      path: '/sr',
      query: {},
      headers: {
        authorization: 'Bearer token',
      },
    });
  } finally {
    client.getJson = originalGetJson;
  }
});

test('listTickets filters locally by resolved status when status is provided', async () => {
  const originalGetJson = client.getJson;

  client.getJson = async () => [
    {
      id: '1',
      info: [
        { key: 'title', value: 'Ticket fechado' },
        { key: 'status', value: 'ATENDIMENTO ENCERRADO' },
      ],
    },
    {
      id: '2',
      info: [
        { key: 'title', value: 'Ticket novo' },
        { key: 'status', value: 'NOVO' },
      ],
    },
  ];

  try {
    const response = await service.listTickets(
      {
        status: '4',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(
      response.map((ticket) => ticket.ticket.id),
      ['1']
    );
  } finally {
    client.getJson = originalGetJson;
  }
});

test('listTickets maps requester institution from company valueCaption when CustomColumn155sr is absent', async () => {
  const originalGetJson = client.getJson;

  client.getJson = async () => [
    {
      id: '177888',
      info: [
        { key: 'title', value: 'Teste de abertura via backend local' },
        { key: 'status', value: 'EM ATENDIMENTO N2' },
        {
          key: 'company',
          value: '56',
          valueCaption: 'BCO SANTANDER (BRASIL) S.A.',
        },
      ],
    },
  ];

  try {
    const response = await service.listTickets({}, { authorization: 'Bearer token' });

    assert.deepStrictEqual(response[0].assignment.instituicao_requerente, 'BCO SANTANDER (BRASIL) S.A.');
  } finally {
    client.getJson = originalGetJson;
  }
});

test('listTickets filters locally by classified owner slug when ownerSlug is provided', async () => {
  const originalGetJson = client.getJson;
  const originalClassifyTickets = ticketOwnerClassificationService.classifyTickets;

  client.getJson = async () => [
    {
      id: '177888',
      info: [
        { key: 'title', value: 'Ticket equipe SU' },
        { key: 'status', value: 'EM ATENDIMENTO N2' },
      ],
    },
    {
      id: '177889',
      info: [
        { key: 'title', value: 'Ticket equipe Consentimentos' },
        { key: 'status', value: 'EM ATENDIMENTO N2' },
      ],
    },
  ];

  ticketOwnerClassificationService.classifyTickets = async (tickets) => [
    {
      ...tickets[0],
      routing: {
        owner_slug: 'su-super-usuarios',
        owner_name: 'SU (Super Usuário)',
        resolution_type: 'fallback_su',
        matched_rule_group: null,
      },
    },
    {
      ...tickets[1],
      routing: {
        owner_slug: 'consentimentos-outbound',
        owner_name: 'Consentimentos Outbound',
        resolution_type: 'automatic',
        matched_rule_group: 'consents-endpoint',
      },
    },
  ];

  try {
    const response = await service.listTickets(
      {
        ownerSlug: 'consentimentos-outbound',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(
      response.map((ticket) => ticket.ticket.id),
      ['177889']
    );
  } finally {
    client.getJson = originalGetJson;
    ticketOwnerClassificationService.classifyTickets = originalClassifyTickets;
  }
});

test('listTickets filters by flow current owner when ticket has been redirected internally', async () => {
  const originalGetJson = client.getJson;
  const originalClassifyTickets = ticketOwnerClassificationService.classifyTickets;
  const originalAttachFlowStates = ticketFlowService.attachFlowStates;
  const originalSyncTicketFlows = ticketFlowService.syncTicketFlows;

  client.getJson = async () => [
    {
      id: '177890',
      info: [
        { key: 'title', value: 'Ticket redirecionado no fluxo' },
        { key: 'status', value: 'EM ATENDIMENTO N2' },
      ],
    },
  ];

  ticketOwnerClassificationService.classifyTickets = async (tickets) => [
    {
      ...tickets[0],
      routing: {
        owner_slug: 'su-super-usuarios',
        owner_name: 'SU (Super Usuário)',
        resolution_type: 'fallback_su',
        matched_rule_group: null,
      },
    },
  ];

  ticketFlowService.syncTicketFlows = async () => [];
  ticketFlowService.attachFlowStates = async (tickets) => [
    {
      ...tickets[0],
      flow: {
        current_owner_slug: 'consentimentos-outbound',
      },
    },
  ];

  try {
    const response = await service.listTickets(
      {
        ownerSlug: 'consentimentos-outbound',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(
      response.map((ticket) => ticket.ticket.id),
      ['177890']
    );
  } finally {
    client.getJson = originalGetJson;
    ticketOwnerClassificationService.classifyTickets = originalClassifyTickets;
    ticketFlowService.attachFlowStates = originalAttachFlowStates;
    ticketFlowService.syncTicketFlows = originalSyncTicketFlows;
  }
});

test('listTickets hides immutable statuses from operational queues when no explicit status filter is provided', async () => {
  const originalGetJson = client.getJson;
  const originalClassifyTickets = ticketOwnerClassificationService.classifyTickets;
  const originalAttachFlowStates = ticketFlowService.attachFlowStates;
  const originalSyncTicketFlows = ticketFlowService.syncTicketFlows;

  client.getJson = async () => [
    {
      id: '177891',
      info: [
        { key: 'title', value: 'Ticket cancelado' },
        { key: 'status', value: 'CANCELADO' },
      ],
    },
    {
      id: '177892',
      info: [
        { key: 'title', value: 'Ticket ativo' },
        { key: 'status', value: 'EM ATENDIMENTO N2' },
      ],
    },
    {
      id: '177893',
      info: [
        { key: 'title', value: 'Ticket com fluxo encerrado' },
        { key: 'status', value: 'EM ATENDIMENTO N2' },
      ],
    },
  ];

  ticketOwnerClassificationService.classifyTickets = async (tickets) =>
    tickets.map((ticket) => ({
      ...ticket,
      routing: {
        owner_slug: 'su-super-usuarios',
        owner_name: 'SU (Super Usuário)',
        resolution_type: 'fallback_su',
        matched_rule_group: null,
      },
    }));

  ticketFlowService.syncTicketFlows = async () => [];
  ticketFlowService.attachFlowStates = async (tickets) => [
    {
      ...tickets[0],
      flow: {
        current_owner_slug: 'su-super-usuarios',
        ticket_status: 'CANCELADO',
      },
    },
    {
      ...tickets[1],
      flow: {
        current_owner_slug: 'su-super-usuarios',
        ticket_status: 'EM ATENDIMENTO N2',
      },
    },
    {
      ...tickets[2],
      flow: {
        current_owner_slug: 'su-super-usuarios',
        ticket_status: 'ATENDIMENTO ENCERRADO',
      },
    },
  ];

  try {
    const response = await service.listTickets(
      {
        ownerSlug: 'su-super-usuarios',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(
      response.map((ticket) => ticket.ticket.id),
      ['177892']
    );
  } finally {
    client.getJson = originalGetJson;
    ticketOwnerClassificationService.classifyTickets = originalClassifyTickets;
    ticketFlowService.attachFlowStates = originalAttachFlowStates;
    ticketFlowService.syncTicketFlows = originalSyncTicketFlows;
  }
});

test('listKnownTickets maps ownerSlug query to local flow lookup', async () => {
  const originalListTicketFlows = ticketFlowService.listTicketFlows;
  let capturedQuery = null;

  ticketFlowService.listTicketFlows = async (query) => {
    capturedQuery = query;
    return [
      {
        ticket_id: '177894',
        current_owner_slug: 'consentimentos-outbound',
      },
    ];
  };

  try {
    const response = await service.listKnownTickets({
      ownerSlug: 'consentimentos-outbound',
      acceptedByTeam: 'true',
    });

    assert.deepStrictEqual(capturedQuery, {
      currentOwnerSlug: 'consentimentos-outbound',
      currentStage: null,
      acceptedByTeam: 'true',
      respondedByTeam: undefined,
      returnedToSu: undefined,
    });
    assert.deepStrictEqual(response, [
      {
        ticket_id: '177894',
        current_owner_slug: 'consentimentos-outbound',
      },
    ]);
  } finally {
    ticketFlowService.listTicketFlows = originalListTicketFlows;
  }
});

test('getTicketById formats the upstream payload into the public ticket contract', async () => {
  const originalGetJson = client.getJson;
  const originalClassifyTicket = ticketOwnerClassificationService.classifyTicket;
  const originalSyncTicketFlows = ticketFlowService.syncTicketFlows;
  const originalAttachFlowStates = ticketFlowService.attachFlowStates;
  let captured = null;

  ticketOwnerClassificationService.classifyTicket = async (ticket) => ({
    ...ticket,
    routing: {
      owner_slug: 'su-super-usuarios',
      owner_name: 'SU (Super Usuário)',
      resolution_type: 'classification_unavailable',
      matched_rule_group: null,
    },
  });
  ticketFlowService.syncTicketFlows = async () => [];
  ticketFlowService.attachFlowStates = async (tickets) => tickets.map((t) => ({ ...t, flow: null }));

  client.getJson = async (path, query, headers) => {
    captured = { path, query, headers };
    return {
      id: '166933',
      info: [
        { key: 'title', value: 'Dados de Conta Não Estão Sendo Enviados' },
        { key: 'status', value: 'ATENDIMENTO ENCERRADO' },
        { key: 'type', value: '1' },
        { key: 'template', value: '20' },
        {
          key: 'description',
          value:
            'Prezados,\r\n\r\nO nosso cliente reporta que ao tentar realizar a coleta de dados de conta para o consentimento urn:cartoes:dados-9cbe331f-5c50-4b36-9054-0596c0845d6c não estamos recebendo nenhum dado.\r\nPoderiam verificar?',
        },
        { key: 'sr_type', value: 'Incidente' },
        { key: 'problem_type', value: 'Erro na Jornada ou Dados' },
        { key: 'problem_sub_type', value: 'Trabalhando os Dados' },
        { key: 'third_level_category', value: 'Tipo F V3' },
        { key: 'CustomColumn68sr', keyCaption: 'URL do endpoint acionado', value: 'https://example.com/endpoint' },
        { key: 'CustomColumn70sr', keyCaption: 'Código HTTP', value: '2XX' },
        { key: 'CustomColumn156sr', keyCaption: 'X-Fapi-Interaction-ID', value: 'interaction-id' },
        { key: 'CustomColumn69sr', value: '{"headers":{},"payload":{}}' },
        { key: 'CustomColumn71sr', value: '{"headers":{},"payload":{}}' },
        { key: 'CustomColumn171sr', value: '10 Dias' },
        { key: 'CustomColumn170sr', value: '7 Dias' },
        { key: 'CustomColumn33sr', value: 'Fora do SLA' },
        { key: 'request_user', value: 'Engenharia Belvo' },
        { key: 'CustomColumn155sr', value: 'Belvo' },
        { key: 'responsibility', value: 'Daniel Vieira Ferreira' },
        { key: 'assigned_group', value: 'N2_Santander' },
        { key: 'current_support_level', value: '2' },
        { key: 'CustomColumn119sr', value: 'Erro de Desconformidade' },
        { key: 'CustomColumn129sr', value: '1' },
        { key: 'CustomColumn164sr', value: '1' },
        { key: 'CustomColumn172sr', value: 'true' },
        { key: 'CustomColumn120sr', value: '1;2' },
        { key: 'solution', value: 'Correção no processamento do ingestor de eventos' },
        { key: 'workaround', value: null },
        { key: 'CustomColumn82sr', value: '1774261975000' },
        { key: 'reopen_counter', value: '2' },
        { key: 'archive', value: '0' },
      ],
      notes: [{ userName: 'Rafael', createDate: 1772109147000, text: 'Nota' }],
      attachments: [{ id: 30, name: 'evidencia.txt', contentType: 'text/plain', size: 50, createDate: 1772109147000 }],
      due_date: '1773356399000',
      insert_time: '1772109147000',
      update_time: '1774261975000',
      close_time: '1774261975000',
      history: [{ id: 10, userName: 'N2', description: 'Atividade', logTime: 1772109147000, type: 'Incident changed' }],
    };
  };

  try {
    const response = await service.getTicketById('166933', {
      authorization: 'Bearer token',
    });

    assert.deepStrictEqual(captured, {
      path: '/sr/166933',
      query: undefined,
      headers: {
        authorization: 'Bearer token',
      },
    });

    assert.deepStrictEqual(response, {
      ticket: {
        id: '166933',
        title: 'Dados de Conta Não Estão Sendo Enviados',
        description: {
          summary: 'Erro ao coletar dados de conta para consentimento',
          full:
            'Prezados,\n\nO nosso cliente reporta que ao tentar realizar a coleta de dados de conta para o consentimento urn:cartoes:dados-9cbe331f-5c50-4b36-9054-0596c0845d6c não estamos recebendo nenhum dado.\nPoderiam verificar?',
        },
        status: 'ATENDIMENTO ENCERRADO',
        type: '1',
        sr_type: 'Incidente',
        template: '20',
        category: {
          nivel1: 'Erro na Jornada ou Dados',
          nivel2: 'Trabalhando os Dados',
          nivel3: 'Tipo F V3',
        },
      },
      api_context: {
        endpoint: 'https://example.com/endpoint',
        http_status: '2XX',
        interaction_id: 'interaction-id',
        request: {
          headers: {},
          payload: {},
        },
        response: {
          headers: {},
          payload: {},
        },
      },
      sla: {
        sla_dias: '10 Dias',
        sla_atraso: '7 Dias',
        status: 'Fora do SLA',
        due_date: new Date(1773356399000).toISOString(),
        due_date_ms: 1773356399000,
      },
      assignment: {
        solicitante: 'Engenharia Belvo',
        instituicao_requerente: 'Belvo',
        responsavel: 'Daniel Vieira Ferreira',
        grupo: 'N2_Santander',
        nivel_suporte_atual: '2',
      },
      analysis: {
        erro_tipo: 'Erro de Desconformidade',
        procedente: true,
        escopo: 'Bilateral',
        monitoramento: true,
        tipo_cliente: ['PF', 'PJ'],
      },
      solution: {
        descricao: 'Correção no processamento do ingestor de eventos',
        workaround: null,
        data_prevista_implementacao: new Date(1774261975000).toISOString(),
        data_prevista_implementacao_ms: 1774261975000,
      },
      timestamps: {
        criado_em: new Date(1772109147000).toISOString(),
        criado_em_ms: 1772109147000,
        atualizado_em: new Date(1774261975000).toISOString(),
        atualizado_em_ms: 1774261975000,
        encerrado_em: new Date(1774261975000).toISOString(),
        encerrado_em_ms: 1774261975000,
      },
      lifecycle: {
        reopen_counter: '2',
        archived: false,
      },
      notes: [
        {
          user_name: 'Rafael',
          create_date: new Date(1772109147000).toISOString(),
          create_date_ms: 1772109147000,
          text: 'Nota',
        },
      ],
      activities: [
        {
          id: 10,
          user_name: 'N2',
          description: 'Atividade',
          logged_at: new Date(1772109147000).toISOString(),
          logged_at_ms: 1772109147000,
          type: 'Incident changed',
        },
      ],
      attachments: [
        {
          id: 30,
          file_id: 30,
          file_name: 'evidencia.txt',
          real_file_name: null,
          file_date: new Date(1772109147000).toISOString(),
          ticket_id: '166933',
          download_url:
            'https://servicedesk.openfinancebrasil.org.br/getFile?table=service_req&id=166933&getFile=30',
          name: 'evidencia.txt',
          content_type: 'text/plain',
          size: 50,
          created_at: new Date(1772109147000).toISOString(),
          created_at_ms: 1772109147000,
        },
      ],
      raw_fields: [
        {
          key: 'CustomColumn68sr',
          label: 'URL do endpoint acionado',
          value: 'https://example.com/endpoint',
        },
        {
          key: 'CustomColumn70sr',
          label: 'Código HTTP',
          value: '2XX',
        },
        {
          key: 'CustomColumn156sr',
          label: 'X-Fapi-Interaction-ID',
          value: 'interaction-id',
        },
      ],
      routing: {
        owner_slug: 'su-super-usuarios',
        owner_name: 'SU (Super Usuário)',
        resolution_type: 'classification_unavailable',
        matched_rule_group: null,
      },
      flow: null,
    });
  } finally {
    client.getJson = originalGetJson;
    ticketOwnerClassificationService.classifyTicket = originalClassifyTicket;
    ticketFlowService.syncTicketFlows = originalSyncTicketFlows;
    ticketFlowService.attachFlowStates = originalAttachFlowStates;
  }
});

test('createTicket requires template query param', async () => {
  await assert.rejects(
    () => service.createTicket({ info: [{ key: 'title', value: 'Ticket' }] }, {}, {}),
    (error) => error.message === 'Query param "template" is required to create a ticket.'
  );
});

test('createTicket sends normalized body and default type', async () => {
  const originalPostJson = client.postJson;
  let captured = null;

  client.postJson = async (path, body, query, headers) => {
    captured = { path, body, query, headers };
    return { id: 2001 };
  };

  try {
    const payload = {
      info: [
        { key: 'problem_type', value: 'Incidentes_Diretório_Erro' },
        { key: 'title', value: 'Teste' },
      ],
    };

    const response = await service.createTicket(payload, { template: '20' }, { cookie: 'JSESSIONID=1' });

    assert.deepStrictEqual(response, { id: 2001 });
    assert.deepStrictEqual(captured, {
      path: '/sr',
      body: payload,
      query: {
        type: '1',
        template: '20',
      },
      headers: {
        cookie: 'JSESSIONID=1',
      },
    });
  } finally {
    client.postJson = originalPostJson;
  }
});

test('updateTicket injects ticket id into upstream payload when absent', async () => {
  const originalPutJson = client.putJson;
  let captured = null;

  client.putJson = async (path, body, headers) => {
    captured = { path, body, headers };
    return { updated: true };
  };

  try {
    const response = await service.updateTicket(
      '1273',
      {
        info: [{ key: 'status', value: '8' }],
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(response, { updated: true });
    assert.deepStrictEqual(captured, {
      path: '/sr/1273',
      body: {
        id: '1273',
        info: [{ key: 'status', value: '8' }],
      },
      headers: {
        authorization: 'Bearer token',
      },
    });
  } finally {
    client.putJson = originalPutJson;
  }
});

test('createTicketAttachment requires multipart file', async () => {
  await assert.rejects(
    () => service.createTicketAttachment('1273', null, {}),
    (error) => error.message === 'Multipart field "file" is required.'
  );
});

test('createTicketActivity validates required fields and forwards payload', async () => {
  const originalPostJson = client.postJson;
  let captured = null;

  client.postJson = async (path, body, query, headers) => {
    captured = { path, body, query, headers };
    return { created: true };
  };

  try {
    const response = await service.createTicketActivity(
      '1273',
      {
        userId: 123456,
        fromTime: 1652904309000,
        toTime: 1652904309000,
        description: 'Atividade inserida automaticamente',
      },
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(response, { created: true });
    assert.deepStrictEqual(captured, {
      path: '/sr/1273/activity',
      body: {
        id: '1273',
        userId: 123456,
        fromTime: 1652904309000,
        toTime: 1652904309000,
        description: 'Atividade inserida automaticamente',
      },
      query: undefined,
      headers: {
        authorization: 'Bearer token',
      },
    });
  } finally {
    client.postJson = originalPostJson;
  }
});

test('downloadTicketAttachment proxies the attachment download using the managed upstream session', async () => {
  const originalDownloadBinary = client.downloadBinary;
  let captured = null;

  client.downloadBinary = async (url, headers) => {
    captured = { url, headers };
    return {
      buffer: Buffer.from('file-content'),
      headers: {
        contentType: 'application/pdf',
        contentDisposition: 'attachment; filename=\"Summary.pdf\"',
        contentLength: '12',
      },
    };
  };

  try {
    const response = await service.downloadTicketAttachment(
      '166933',
      '30',
      { cookie: 'JSESSIONID=abc123', cache: 'cache-token' }
    );

    assert.deepStrictEqual(captured, {
      url: 'https://servicedesk.openfinancebrasil.org.br/getFile?table=service_req&id=166933&getFile=30',
      headers: {
        cookie: 'JSESSIONID=abc123',
        cache: 'cache-token',
      },
    });
    assert.strictEqual(response.buffer.toString(), 'file-content');
    assert.deepStrictEqual(response.headers, {
      contentType: 'application/pdf',
      contentDisposition: 'attachment; filename=\"Summary.pdf\"',
      contentLength: '12',
    });
  } finally {
    client.downloadBinary = originalDownloadBinary;
  }
});

test('listRequiredTemplateFields uses template id as fallback query value', async () => {
  const originalGetJson = client.getJson;
  let captured = null;

  client.getJson = async (path, query, headers) => {
    captured = { path, query, headers };
    return { fields: [] };
  };

  try {
    const response = await service.listRequiredTemplateFields(
      '20',
      {},
      { authorization: 'Bearer token' }
    );

    assert.deepStrictEqual(response, { fields: [] });
    assert.deepStrictEqual(captured, {
      path: '/sr/template',
      query: {
        type: 'incident',
        template: '20',
        view: '1',
      },
      headers: {
        authorization: 'Bearer token',
      },
    });
  } finally {
    client.getJson = originalGetJson;
  }
});
