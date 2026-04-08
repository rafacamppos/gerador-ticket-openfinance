const { Pool, types } = require('pg');
const {
  databaseHost,
  databasePort,
  databaseName,
  databaseUser,
  databasePassword,
  databaseTimezone,
} = require('../config/env');
const logger = require('../utils/logger');

let pool;

// Keep timestamp values as strings so the API does not silently re-serialize them in UTC.
types.setTypeParser(1114, (value) => value);
types.setTypeParser(1184, (value) => value);

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: databaseHost,
      port: databasePort,
      database: databaseName,
      user: databaseUser,
      password: databasePassword,
      options: `-c timezone=${databaseTimezone}`,
      max: 5,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (error) => {
      logger.error('PostgreSQL pool error', { errorMessage: error.message });
    });
  }

  return pool;
}

module.exports = {
  getPool,
};
