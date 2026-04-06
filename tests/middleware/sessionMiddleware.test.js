const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const sessionMiddleware = require('../../src/middleware/sessionMiddleware');

function loadSessionMiddlewareWithMocks({
  expressSessionReturnValue = () => {},
  redisStoreFactory = class {},
  envOverrides = {},
  redisClientFactory = () => ({
    connect: async () => {},
  }),
} = {}) {
  const sessionMiddlewareModulePath = path.resolve(
    __dirname,
    '../../src/middleware/sessionMiddleware.js'
  );
  const expressSessionModulePath = require.resolve('express-session');
  const connectRedisModulePath = require.resolve('connect-redis');
  const envModulePath = path.resolve(__dirname, '../../src/config/env.js');
  const redisClientModulePath = path.resolve(__dirname, '../../src/clients/redisClient.js');

  const originalSessionMiddlewareModule = require.cache[sessionMiddlewareModulePath];
  const originalExpressSessionModule = require.cache[expressSessionModulePath];
  const originalConnectRedisModule = require.cache[connectRedisModulePath];
  const originalEnvModule = require.cache[envModulePath];
  const originalRedisClientModule = require.cache[redisClientModulePath];

  delete require.cache[sessionMiddlewareModulePath];
  delete require.cache[expressSessionModulePath];
  delete require.cache[connectRedisModulePath];
  delete require.cache[envModulePath];
  delete require.cache[redisClientModulePath];

  require.cache[expressSessionModulePath] = {
    id: expressSessionModulePath,
    filename: expressSessionModulePath,
    loaded: true,
    exports: expressSessionReturnValue,
  };
  require.cache[connectRedisModulePath] = {
    id: connectRedisModulePath,
    filename: connectRedisModulePath,
    loaded: true,
    exports: {
      RedisStore: redisStoreFactory,
    },
  };
  require.cache[envModulePath] = {
    id: envModulePath,
    filename: envModulePath,
    loaded: true,
    exports: {
      sessionSecret: 'test-secret',
      sessionTtlSeconds: 123,
      sessionCookieSecure: true,
      ...envOverrides,
    },
  };
  require.cache[redisClientModulePath] = {
    id: redisClientModulePath,
    filename: redisClientModulePath,
    loaded: true,
    exports: {
      getRedisClient: redisClientFactory,
    },
  };

  const loadedModule = require(sessionMiddlewareModulePath);

  return {
    loadedModule,
    restore() {
      if (originalSessionMiddlewareModule) {
        require.cache[sessionMiddlewareModulePath] = originalSessionMiddlewareModule;
      } else {
        delete require.cache[sessionMiddlewareModulePath];
      }

      if (originalExpressSessionModule) {
        require.cache[expressSessionModulePath] = originalExpressSessionModule;
      } else {
        delete require.cache[expressSessionModulePath];
      }

      if (originalConnectRedisModule) {
        require.cache[connectRedisModulePath] = originalConnectRedisModule;
      } else {
        delete require.cache[connectRedisModulePath];
      }

      if (originalEnvModule) {
        require.cache[envModulePath] = originalEnvModule;
      } else {
        delete require.cache[envModulePath];
      }

      if (originalRedisClientModule) {
        require.cache[redisClientModulePath] = originalRedisClientModule;
      } else {
        delete require.cache[redisClientModulePath];
      }
    },
  };
}

test('parseCookies extracts valid key-value pairs and ignores malformed entries', () => {
  assert.deepStrictEqual(
    sessionMiddleware.parseCookies('foo=bar; invalid; open-finance.sid=abc123; empty='),
    {
      foo: 'bar',
      'open-finance.sid': 'abc123',
      empty: '',
    }
  );
});

test('createInMemoryTestSessionMiddleware creates a session and emits cookie header', () => {
  const middleware = sessionMiddleware.createInMemoryTestSessionMiddleware();
  const req = {
    headers: {},
  };
  const res = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true);
  assert.deepStrictEqual(req.session, {});
  assert.match(
    res.headers['Set-Cookie'],
    /^open-finance\.sid=[a-f0-9]+; Path=\/; HttpOnly; SameSite=Lax$/
  );
});

test('createInMemoryTestSessionMiddleware reuses existing session by cookie', () => {
  const middleware = sessionMiddleware.createInMemoryTestSessionMiddleware();
  const firstReq = {
    headers: {},
  };
  const firstRes = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };

  middleware(firstReq, firstRes, () => {});
  firstReq.session.portalUser = { id: '55' };

  const secondReq = {
    headers: {
      cookie: firstRes.headers['Set-Cookie'],
    },
  };
  const secondRes = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };

  middleware(secondReq, secondRes, () => {});

  assert.deepStrictEqual(secondReq.session, {
    portalUser: {
      id: '55',
    },
  });
  assert.strictEqual(secondRes.headers['Set-Cookie'], undefined);
});

test('createRedisSessionStore connects the client and builds redis store with configured ttl', async () => {
  const calls = [];

  class FakeRedisStore {
    constructor(options) {
      this.options = options;
    }
  }

  const fakeRedisClient = {
    async connect() {
      calls.push('connect');
    },
  };

  const { loadedModule, restore } = loadSessionMiddlewareWithMocks({
    redisStoreFactory: FakeRedisStore,
  });

  try {
    const store = await loadedModule.createRedisSessionStore({
      redisClient: fakeRedisClient,
    });

    assert.deepStrictEqual(calls, ['connect']);
    assert.ok(store instanceof FakeRedisStore);
    assert.deepStrictEqual(store.options, {
      client: fakeRedisClient,
      prefix: 'open-finance:sess:',
      ttl: 123,
    });
  } finally {
    restore();
  }
});

test('createExpressSessionMiddleware forwards configured cookie and store options', () => {
  let capturedOptions = null;
  const middlewareResult = () => {};

  const { loadedModule, restore } = loadSessionMiddlewareWithMocks({
    expressSessionReturnValue: (options) => {
      capturedOptions = options;
      return middlewareResult;
    },
  });

  try {
    const store = { id: 'store' };
    const middleware = loadedModule.createExpressSessionMiddleware(store);

    assert.strictEqual(middleware, middlewareResult);
    assert.deepStrictEqual(capturedOptions, {
      name: 'open-finance.sid',
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 123000,
      },
    });
  } finally {
    restore();
  }
});

test('createDefaultSessionMiddleware returns in-memory middleware in test environment', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';

  try {
    const middleware = await sessionMiddleware.createDefaultSessionMiddleware();
    assert.strictEqual(typeof middleware, 'function');
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

test('createDefaultSessionMiddleware composes redis store and express middleware outside test environment', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const calls = [];

  class FakeRedisStore {
    constructor(options) {
      this.options = options;
    }
  }

  const fakeRedisClient = {
    async connect() {
      calls.push('connect');
    },
  };

  let capturedOptions = null;
  const middlewareResult = () => {};

  const { loadedModule, restore } = loadSessionMiddlewareWithMocks({
    expressSessionReturnValue: (options) => {
      capturedOptions = options;
      return middlewareResult;
    },
    redisStoreFactory: FakeRedisStore,
    redisClientFactory: () => fakeRedisClient,
  });

  try {
    const middleware = await loadedModule.createDefaultSessionMiddleware();

    assert.strictEqual(middleware, middlewareResult);
    assert.deepStrictEqual(calls, ['connect']);
    assert.ok(capturedOptions.store instanceof FakeRedisStore);
    assert.deepStrictEqual(capturedOptions.store.options, {
      client: fakeRedisClient,
      prefix: 'open-finance:sess:',
      ttl: 123,
    });
  } finally {
    restore();
    process.env.NODE_ENV = originalNodeEnv;
  }
});
