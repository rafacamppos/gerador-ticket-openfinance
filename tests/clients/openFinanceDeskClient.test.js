const test = require('node:test');
const assert = require('node:assert');

const client = require('../../src/clients/openFinanceDeskClient');
const { openFinanceApiBaseUrl } = require('../../src/config/env');

function createMockHeaders({
  values = {},
  setCookie = null,
} = {}) {
  return {
    get(name) {
      return values[String(name).toLowerCase()] ?? null;
    },
    getSetCookie: setCookie
      ? () => setCookie
      : undefined,
  };
}

test('getServiceDeskBaseUrl prefers context environment base url and trims trailing slash', () => {
  assert.strictEqual(
    client.getServiceDeskBaseUrl({
      environmentBaseUrl: 'https://sandbox.example.com/',
    }),
    'https://sandbox.example.com'
  );
});

test('getServiceDeskBaseUrl falls back to configured base url', () => {
  assert.strictEqual(client.getServiceDeskBaseUrl(), openFinanceApiBaseUrl);
});

test('getApiBaseUrl appends api path to resolved service desk base url', () => {
  assert.strictEqual(
    client.getApiBaseUrl({
      environmentBaseUrl: 'https://sandbox.example.com/',
    }),
    'https://sandbox.example.com/api/v1'
  );
});

test('createUrl preserves upstream api base path when path starts with slash', () => {
  const url = client.createUrl('/login');

  assert.strictEqual(url.toString(), `${openFinanceApiBaseUrl}/api/v1/login`);
});

test('createUrl appends query string parameters to normalized upstream path', () => {
  const url = client.createUrl('/sr', {
    assigned_group: '10',
    problem_type: 'Incidentes_APIs_Erros',
  });

  assert.strictEqual(
    url.toString(),
    `${openFinanceApiBaseUrl}/api/v1/sr?assigned_group=10&problem_type=Incidentes_APIs_Erros`
  );
});

test('createUrl ignores empty query values and uses context base url', () => {
  const url = client.createUrl(
    '/sr',
    {
      assigned_group: '10',
      cache: '',
      page: null,
      limit: undefined,
    },
    {
      environmentBaseUrl: 'https://sandbox.example.com/',
    }
  );

  assert.strictEqual(url.toString(), 'https://sandbox.example.com/api/v1/sr?assigned_group=10');
});

test('getJson forwards only supported headers and returns json payload', async () => {
  const originalFetch = global.fetch;
  let captured = null;

  global.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return {
      ok: true,
      status: 200,
      headers: createMockHeaders({
        values: {
          'content-type': 'application/json',
        },
      }),
      json: async () => ({ ok: true }),
      text: async () => {
        throw new Error('text should not be called');
      },
    };
  };

  try {
    const response = await client.getJson(
      '/tickets',
      { assigned_group: '10' },
      {
        authorization: 'Bearer token',
        cookie: 'JSESSIONID=abc',
        cache: 'cache-token',
        ignored: 'header',
      },
      {
        environmentBaseUrl: 'https://sandbox.example.com/',
      }
    );

    assert.deepStrictEqual(response, { ok: true });
    assert.deepStrictEqual(captured, {
      url: 'https://sandbox.example.com/api/v1/tickets?assigned_group=10',
      options: {
        method: 'GET',
        headers: {
          authorization: 'Bearer token',
          cookie: 'JSESSIONID=abc',
          cache: 'cache-token',
        },
      },
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('getJson returns text payload when upstream content type is not json', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: createMockHeaders({
      values: {
        'content-type': 'text/plain',
      },
    }),
    json: async () => {
      throw new Error('json should not be called');
    },
    text: async () => 'ok',
  });

  try {
    const response = await client.getJson('/health');
    assert.strictEqual(response, 'ok');
  } finally {
    global.fetch = originalFetch;
  }
});

test('getJson throws upstream error preserving status and json details', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: false,
    status: 502,
    headers: createMockHeaders({
      values: {
        'content-type': 'application/json',
      },
    }),
    json: async () => ({ message: 'upstream failed' }),
    text: async () => {
      throw new Error('text should not be called');
    },
  });

  try {
    await assert.rejects(
      () => client.getJson('/tickets'),
      (error) => {
        assert.strictEqual(error.message, 'Open Finance upstream request failed.');
        assert.strictEqual(error.status, 502);
        assert.deepStrictEqual(error.details, { message: 'upstream failed' });
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('postJson sends json body and returns text payload', async () => {
  const originalFetch = global.fetch;
  let captured = null;

  global.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return {
      ok: true,
      status: 201,
      headers: createMockHeaders({
        values: {
          'content-type': 'text/plain',
        },
      }),
      json: async () => {
        throw new Error('json should not be called');
      },
      text: async () => 'created',
    };
  };

  try {
    const response = await client.postJson(
      '/sr',
      { info: [{ key: 'title', value: 'Teste' }] },
      { template: '10', type: '1' },
      { authorization: 'Bearer token' }
    );

    assert.strictEqual(response, 'created');
    assert.deepStrictEqual(captured, {
      url: `${openFinanceApiBaseUrl}/api/v1/sr?template=10&type=1`,
      options: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
        body: JSON.stringify({ info: [{ key: 'title', value: 'Teste' }] }),
      },
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('postJsonWithMeta returns payload and response headers metadata', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: createMockHeaders({
      values: {
        'content-type': 'application/json',
        cookie: 'JSESSIONID=abc123',
        'x-cache': 'cache-token',
      },
      setCookie: ['JSESSIONID=abc123; Path=/', '', 'ROUTEID=node-1; Path=/'],
    }),
    json: async () => ({ authenticated: true }),
    text: async () => {
      throw new Error('text should not be called');
    },
  });

  try {
    const response = await client.postJsonWithMeta('/login', {
      user_name: 'api.user',
      password: 'secret',
    });

    assert.deepStrictEqual(response, {
      payload: {
        authenticated: true,
      },
      headers: {
        setCookie: ['JSESSIONID=abc123; Path=/', 'ROUTEID=node-1; Path=/'],
        cookie: ['JSESSIONID=abc123'],
        cache: 'cache-token',
      },
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('postJsonWithMeta falls back to cache header when x-cache is absent', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: createMockHeaders({
      values: {
        'content-type': 'application/json',
        cache: 'cache-header',
      },
    }),
    json: async () => ({ authenticated: true }),
    text: async () => {
      throw new Error('text should not be called');
    },
  });

  try {
    const response = await client.postJsonWithMeta('/login', {
      user_name: 'api.user',
      password: 'secret',
    });

    assert.strictEqual(response.headers.cache, 'cache-header');
    assert.deepStrictEqual(response.headers.setCookie, []);
    assert.deepStrictEqual(response.headers.cookie, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test('putJson sends json body and returns json payload', async () => {
  const originalFetch = global.fetch;
  let captured = null;

  global.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return {
      ok: true,
      status: 200,
      headers: createMockHeaders({
        values: {
          'content-type': 'application/json',
        },
      }),
      json: async () => ({ id: 10, updated: true }),
      text: async () => {
        throw new Error('text should not be called');
      },
    };
  };

  try {
    const response = await client.putJson(
      '/sr/10',
      { info: [{ key: 'description', value: 'Atualizado' }] },
      { cookie: 'JSESSIONID=abc' }
    );

    assert.deepStrictEqual(response, { id: 10, updated: true });
    assert.deepStrictEqual(captured, {
      url: `${openFinanceApiBaseUrl}/api/v1/sr/10`,
      options: {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          cookie: 'JSESSIONID=abc',
        },
        body: JSON.stringify({ info: [{ key: 'description', value: 'Atualizado' }] }),
      },
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('postMultipart sends form data and uses default file values when absent', async () => {
  const originalFetch = global.fetch;
  let captured = null;

  global.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return {
      ok: true,
      status: 201,
      headers: createMockHeaders({
        values: {
          'content-type': 'application/json',
        },
      }),
      json: async () => ({ uploaded: true }),
      text: async () => {
        throw new Error('text should not be called');
      },
    };
  };

  try {
    const response = await client.postMultipart(
      '/sr/10/attachments',
      {
        buffer: Buffer.from('file-content'),
      },
      {
        cookie: 'JSESSIONID=abc',
      }
    );

    assert.deepStrictEqual(response, { uploaded: true });
    assert.strictEqual(captured.url, `${openFinanceApiBaseUrl}/api/v1/sr/10/attachments`);
    assert.strictEqual(captured.options.method, 'POST');
    assert.deepStrictEqual(captured.options.headers, {
      cookie: 'JSESSIONID=abc',
    });
    assert.ok(captured.options.body instanceof FormData);
  } finally {
    global.fetch = originalFetch;
  }
});

test('downloadBinary returns binary buffer and response headers', async () => {
  const originalFetch = global.fetch;
  let captured = null;

  global.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return {
      ok: true,
      status: 200,
      url: 'https://sandbox.example.com/attachment',
      headers: createMockHeaders({
        values: {
          'content-type': 'text/plain',
          'content-disposition': 'attachment; filename="arquivo.txt"',
          'content-length': '7',
        },
      }),
      arrayBuffer: async () => Uint8Array.from(Buffer.from('arquivo')).buffer,
    };
  };

  try {
    const response = await client.downloadBinary('https://sandbox.example.com/attachment', {
      authorization: 'Bearer token',
      cookie: 'JSESSIONID=abc',
    });

    assert.strictEqual(response.buffer.toString(), 'arquivo');
    assert.deepStrictEqual(response.headers, {
      contentType: 'text/plain',
      contentDisposition: 'attachment; filename="arquivo.txt"',
      contentLength: '7',
    });
    assert.deepStrictEqual(captured, {
      url: 'https://sandbox.example.com/attachment',
      options: {
        method: 'GET',
        headers: {
          authorization: 'Bearer token',
          cookie: 'JSESSIONID=abc',
        },
      },
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('downloadBinary rejects when upstream redirects to login page', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    status: 200,
    url: 'https://servicedesk.example.com/Login.jsp',
    headers: createMockHeaders(),
    arrayBuffer: async () => {
      throw new Error('arrayBuffer should not be called');
    },
  });

  try {
    await assert.rejects(
      () => client.downloadBinary('https://sandbox.example.com/attachment'),
      (error) => {
        assert.strictEqual(error.message, 'Open Finance upstream request failed.');
        assert.strictEqual(error.status, 401);
        assert.deepStrictEqual(error.details, {
          redirectedToLogin: true,
          url: 'https://servicedesk.example.com/Login.jsp',
        });
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('downloadBinary rejects preserving text payload on upstream error', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: false,
    status: 500,
    url: 'https://sandbox.example.com/attachment',
    headers: createMockHeaders(),
    text: async () => 'internal error',
  });

  try {
    await assert.rejects(
      () => client.downloadBinary('https://sandbox.example.com/attachment'),
      (error) => {
        assert.strictEqual(error.message, 'Open Finance upstream request failed.');
        assert.strictEqual(error.status, 500);
        assert.strictEqual(error.details, 'internal error');
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});
