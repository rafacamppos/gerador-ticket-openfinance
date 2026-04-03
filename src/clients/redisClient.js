const { redisUrl } = require('../config/env');
const logger = require('../utils/logger');

let redisClient;

function getRedisClient() {
  if (!redisClient) {
    const { createClient } = require('redis');

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error', { errorMessage: error.message });
    });
  }

  return redisClient;
}

module.exports = {
  getRedisClient,
};
