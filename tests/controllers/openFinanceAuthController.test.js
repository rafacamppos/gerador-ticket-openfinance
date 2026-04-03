const test = require('node:test');
const assert = require('node:assert');

const controller = require('../../src/controllers/openFinanceAuthController');
const openFinanceAuthService = require('../../src/services/openFinanceAuthService');
const portalAuthService = require('../../src/services/portalAuthService');
const { createMockResponse } = require('../helpers/testHelpers');

// Provide a unified service object so existing test code can reference service.xxx
const service = {
  get createSession() { return openFinanceAuthService.createSession; },
  set createSession(fn) { openFinanceAuthService.createSession = fn; },
  get loginPortalUser() { return portalAuthService.loginPortalUser; },
  set loginPortalUser(fn) { portalAuthService.loginPortalUser = fn; },
  get getPortalSessionUser() { return portalAuthService.getPortalSessionUser; },
  set getPortalSessionUser(fn) { portalAuthService.getPortalSessionUser = fn; },
};

test('createSession stores upstream cookie and cache in express session', async () => {
  const originalCreateSession = service.createSession;

  service.createSession = async () => ({
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
      cookie: 'JSESSIONID=abc123',
      cache: 'cached-login-state',
    },
  });

  const req = {
    body: {
      userName: 'api.user',
      password: 'secret',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.createSession(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.body.sistema, {
      versao: 'v24.4.60',
      idioma: 'pt',
      formato_data: 'dd-MM-yyyy HH:mm',
    });
    assert.deepStrictEqual(req.session.openFinanceSession, {
      cookie: 'JSESSIONID=abc123',
      cache: 'cached-login-state',
    });
  } finally {
    service.createSession = originalCreateSession;
  }
});

test('createSession accepts missing body and still stores upstream session', async () => {
  const originalCreateSession = service.createSession;
  let capturedBody = null;

  service.createSession = async (body) => {
    capturedBody = body;
    return {
      response: {
        sistema: { versao: 'v1' },
      },
      sessionState: {
        cookie: 'JSESSIONID=empty-body',
        cache: 'cache-empty-body',
      },
    };
  };

  const req = {
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.createSession(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(capturedBody, undefined);
    assert.deepStrictEqual(res.body, {
      sistema: { versao: 'v1' },
    });
    assert.deepStrictEqual(req.session.openFinanceSession, {
      cookie: 'JSESSIONID=empty-body',
      cache: 'cache-empty-body',
    });
  } finally {
    service.createSession = originalCreateSession;
  }
});

test('createSession forwards service errors to next without writing response', async () => {
  const originalCreateSession = service.createSession;
  const failure = new Error('Falha ao criar sessão.');
  let forwardedError = null;

  service.createSession = async () => {
    throw failure;
  };

  const req = {
    body: {
      userName: 'api.user',
      password: 'secret',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.createSession(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
    assert.strictEqual(req.session.openFinanceSession, undefined);
  } finally {
    service.createSession = originalCreateSession;
  }
});

test('loginPortalUser stores the authenticated portal user in session', async () => {
  const originalLoginPortalUser = service.loginPortalUser;

  service.loginPortalUser = async () => ({
    id: '1',
    name: 'Rafael de Campos',
    email: 'rafael.campos@f1rst.com.br',
    profile: 'adm',
    team: {
      id: '10',
      slug: 'consentimentos-inbound',
      name: 'Consentimentos Inbound',
    },
  });

  const req = {
    body: {
      email: 'rafael.campos@f1rst.com.br',
      password: '123456',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.loginPortalUser(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(req.session.portalUser, res.body);
  } finally {
    service.loginPortalUser = originalLoginPortalUser;
  }
});

test('loginPortalUser forwards empty body to service and returns the authenticated user', async () => {
  const originalLoginPortalUser = service.loginPortalUser;
  let capturedBody = null;

  service.loginPortalUser = async (body) => {
    capturedBody = body;
    return {
      id: '2',
      name: 'Operador',
      email: 'operador@empresa.com',
      profile: 'user',
      team: {
        id: '11',
        slug: 'time-b',
        name: 'Time B',
      },
    };
  };

  const req = {
    body: {},
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.loginPortalUser(req, res, (error) => {
      throw error;
    });

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(capturedBody, {});
    assert.strictEqual(res.body.email, 'operador@empresa.com');
  } finally {
    service.loginPortalUser = originalLoginPortalUser;
  }
});

test('loginPortalUser forwards service errors to next without writing response', async () => {
  const originalLoginPortalUser = service.loginPortalUser;
  const failure = new Error('Falha no login do portal.');
  let forwardedError = null;

  service.loginPortalUser = async () => {
    throw failure;
  };

  const req = {
    body: {
      email: 'rafael.campos@f1rst.com.br',
      password: '123456',
    },
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.loginPortalUser(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
    assert.strictEqual(req.session.portalUser, undefined);
  } finally {
    service.loginPortalUser = originalLoginPortalUser;
  }
});

test('getPortalSessionUser returns 401 when no portal session exists', async () => {
  const req = {
    session: {},
  };
  const res = createMockResponse();

  await controller.getPortalSessionUser(req, res, (error) => {
    throw error;
  });

  assert.strictEqual(res.statusCode, 401);
  assert.deepStrictEqual(res.body, {
    message: 'Usuário não autenticado.',
  });
});

test('getPortalSessionUser returns 401 when session is absent', async () => {
  const req = {};
  const res = createMockResponse();

  await controller.getPortalSessionUser(req, res, (error) => {
    throw error;
  });

  assert.strictEqual(res.statusCode, 401);
  assert.deepStrictEqual(res.body, {
    message: 'Usuário não autenticado.',
  });
});

test('getPortalSessionUser returns the authenticated user stored in session', async () => {
  const req = {
    session: {
      portalUser: {
        id: '1',
        name: 'Rafael de Campos',
        email: 'rafael.campos@f1rst.com.br',
        profile: 'adm',
        team: {
          id: '10',
          slug: 'consentimentos-inbound',
          name: 'Consentimentos Inbound',
        },
      },
    },
  };
  const res = createMockResponse();

  await controller.getPortalSessionUser(req, res, (error) => {
    throw error;
  });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.email, 'rafael.campos@f1rst.com.br');
});

test('getPortalSessionUser forwards service errors to next without writing response', async () => {
  const originalGetPortalSessionUser = service.getPortalSessionUser;
  const failure = new Error('Falha ao consultar usuário da sessão.');
  let forwardedError = null;

  service.getPortalSessionUser = () => {
    throw failure;
  };

  const req = {
    session: {},
  };
  const res = createMockResponse();

  try {
    await controller.getPortalSessionUser(req, res, (error) => {
      forwardedError = error;
    });

    assert.strictEqual(forwardedError, failure);
    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(res.body, null);
  } finally {
    service.getPortalSessionUser = originalGetPortalSessionUser;
  }
});

test('logoutPortalUser clears session user and returns 204', async () => {
  const req = {
    session: {
      portalUser: {
        id: '1',
        email: 'rafael.campos@f1rst.com.br',
      },
    },
  };
  const res = createMockResponse();

  await controller.logoutPortalUser(req, res, (error) => {
    throw error;
  });

  assert.strictEqual(req.session.portalUser, null);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.ended, true);
});

test('logoutPortalUser forwards persist errors to next without ending response', async () => {
  let forwardedError = null;
  const failure = new Error('Falha ao persistir sessão.');

  const req = {
    session: {
      portalUser: {
        id: '1',
      },
      save(callback) {
        callback(failure);
      },
    },
  };
  const res = createMockResponse();

  await controller.logoutPortalUser(req, res, (error) => {
    forwardedError = error;
  });

  assert.strictEqual(forwardedError, failure);
  assert.strictEqual(res.statusCode, null);
  assert.strictEqual(res.ended, false);
});
