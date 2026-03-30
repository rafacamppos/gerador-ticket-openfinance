const { port } = require('./config/env');
const logger = require('./utils/logger');
const { createApp } = require('./app');
const { createDefaultSessionMiddleware } = require('./middleware/sessionMiddleware');

async function start() {
  const sessionMiddleware = await createDefaultSessionMiddleware();
  const app = createApp({ sessionMiddleware });

  app.listen(port, () => {
    logger.info('Open Finance ticket automation API listening', {
      port,
    });
  });
}

start().catch((error) => {
  logger.error('Failed to start Open Finance ticket automation API', {
    errorMessage: error.message,
  });
  process.exit(1);
});
