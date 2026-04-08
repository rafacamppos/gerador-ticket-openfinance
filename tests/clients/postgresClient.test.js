const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function loadClientWithMocks({ Pool, types, env }) {
  const modulePath = path.resolve(__dirname, '../../src/clients/postgresClient.js');
  const pgModulePath = require.resolve('pg');
  const envModulePath = path.resolve(__dirname, '../../src/config/env.js');
  const loggerModulePath = path.resolve(__dirname, '../../src/utils/logger.js');

  const originalClientModule = require.cache[modulePath];
  const originalPgModule = require.cache[pgModulePath];
  const originalEnvModule = require.cache[envModulePath];
  const originalLoggerModule = require.cache[loggerModulePath];

  delete require.cache[modulePath];
  delete require.cache[pgModulePath];
  delete require.cache[envModulePath];
  delete require.cache[loggerModulePath];

  require.cache[pgModulePath] = {
    id: pgModulePath,
    filename: pgModulePath,
    loaded: true,
    exports: { Pool, types },
  };

  require.cache[envModulePath] = {
    id: envModulePath,
    filename: envModulePath,
    loaded: true,
    exports: env,
  };

  require.cache[loggerModulePath] = {
    id: loggerModulePath,
    filename: loggerModulePath,
    loaded: true,
    exports: {
      error() {},
    },
  };

  const client = require(modulePath);

  return {
    client,
    restore() {
      if (originalClientModule) {
        require.cache[modulePath] = originalClientModule;
      } else {
        delete require.cache[modulePath];
      }

      if (originalPgModule) {
        require.cache[pgModulePath] = originalPgModule;
      } else {
        delete require.cache[pgModulePath];
      }

      if (originalEnvModule) {
        require.cache[envModulePath] = originalEnvModule;
      } else {
        delete require.cache[envModulePath];
      }

      if (originalLoggerModule) {
        require.cache[loggerModulePath] = originalLoggerModule;
      } else {
        delete require.cache[loggerModulePath];
      }
    },
  };
}

test('getPool configures postgres session timezone and timestamp parsers', () => {
  const parserCalls = [];
  let capturedConfig = null;

  class FakePool {
    constructor(config) {
      capturedConfig = config;
    }

    on() {}
  }

  const { client, restore } = loadClientWithMocks({
    Pool: FakePool,
    types: {
      setTypeParser(oid, parser) {
        parserCalls.push({ oid, parserType: typeof parser });
      },
    },
    env: {
      databaseHost: 'localhost',
      databasePort: 5440,
      databaseName: 'db',
      databaseUser: 'user',
      databasePassword: 'pass',
      databaseTimezone: 'America/Sao_Paulo',
    },
  });

  try {
    client.getPool();

    assert.deepStrictEqual(parserCalls, [
      { oid: 1114, parserType: 'function' },
      { oid: 1184, parserType: 'function' },
    ]);
    assert.strictEqual(capturedConfig.options, '-c timezone=America/Sao_Paulo');
  } finally {
    restore();
  }
});
