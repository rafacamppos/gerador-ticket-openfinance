const { Pool } = require('pg');
const {
  databaseHost,
  databasePort,
  databaseName,
  databaseUser,
  databasePassword,
} = require('../config/env');
const logger = require('../utils/logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: databaseHost,
      port: databasePort,
      database: databaseName,
      user: databaseUser,
      password: databasePassword,
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
