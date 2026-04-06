const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadClientWithMocks({ createClient, logger, redisUrl = 'redis://localhost:6379' }) {
  const clientModulePath = path.resolve(
    __dirname,
    '../../src/clients/redisClient.js'
  );
  const redisModulePath = require.resolve('redis');
  const loggerModulePath = path.resolve(__dirname, '../../src/utils/logger.js');
  const envModulePath = path.resolve(__dirname, '../../src/config/env.js');

  const originalClientModule = require.cache[clientModulePath];
  const originalRedisModule = require.cache[redisModulePath];
  const originalLoggerModule = require.cache[loggerModulePath];
  const originalEnvModule = require.cache[envModulePath];

  delete require.cache[clientModulePath];
  delete require.cache[redisModulePath];
  delete require.cache[loggerModulePath];
  delete require.cache[envModulePath];

  require.cache[redisModulePath] = {
    id: redisModulePath,
    filename: redisModulePath,
    loaded: true,
    exports: {
      createClient,
    },
  };
  require.cache[loggerModulePath] = {
    id: loggerModulePath,
    filename: loggerModulePath,
    loaded: true,
    exports: logger,
  };
  require.cache[envModulePath] = {
    id: envModulePath,
    filename: envModulePath,
    loaded: true,
    exports: {
      redisUrl,
    },
  };

  const client = require(clientModulePath);

  return {
    client,
    restore() {
      if (originalClientModule) {
        require.cache[clientModulePath] = originalClientModule;
      } else {
        delete require.cache[clientModulePath];
      }

      if (originalRedisModule) {
        require.cache[redisModulePath] = originalRedisModule;
      } else {
        delete require.cache[redisModulePath];
      }

      if (originalLoggerModule) {
        require.cache[loggerModulePath] = originalLoggerModule;
      } else {
        delete require.cache[loggerModulePath];
      }

      if (originalEnvModule) {
        require.cache[envModulePath] = originalEnvModule;
      } else {
        delete require.cache[envModulePath];
      }
    },
  };
}

test('getRedisClient creates client once with configured reconnect strategy and logs errors', () => {
  const calls = [];
  const loggerCalls = [];
  let errorHandler = null;
  const fakeClient = {
    on(eventName, handler) {
      calls.push(['on', eventName]);
      if (eventName === 'error') {
        errorHandler = handler;
      }
    },
  };

  const { client, restore } = loadClientWithMocks({
    createClient(options) {
      calls.push(['createClient', options]);
      return fakeClient;
    },
    logger: {
      error(message, context) {
        loggerCalls.push({ message, context });
      },
    },
  });

  try {
    const first = client.getRedisClient();
    const second = client.getRedisClient();

    assert.strictEqual(first, fakeClient);
    assert.strictEqual(second, fakeClient);
    assert.strictEqual(calls.length, 2);
    assert.strictEqual(calls[0][0], 'createClient');
    assert.strictEqual(calls[0][1].url, 'redis://localhost:6379');
    assert.strictEqual(calls[0][1].socket.reconnectStrategy(5), 500);
    assert.strictEqual(calls[0][1].socket.reconnectStrategy(50), 3000);
    assert.deepStrictEqual(calls[1], ['on', 'error']);

    errorHandler(new Error('redis down'));
    assert.deepStrictEqual(loggerCalls[0], {
      message: 'Redis client error',
      context: {
        errorMessage: 'redis down',
      },
    });
  } finally {
    restore();
  }
});
