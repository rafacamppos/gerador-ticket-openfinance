const { redisUrl } = require('../config/env');

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

    redisClient.on('error', () => {
      // Session middleware handles request-level failures.
    });
  }

  return redisClient;
}

module.exports = {
  getRedisClient,
};
