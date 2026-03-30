const express = require('express');
const openFinanceRoutes = require('./routes/openFinanceRoutes');
const requestLoggingMiddleware = require('./middleware/requestLoggingMiddleware');
const corsMiddleware = require('./middleware/corsMiddleware');
const logger = require('./utils/logger');

function createApp({ sessionMiddleware } = {}) {
  if (typeof sessionMiddleware !== 'function') {
    throw new Error('A configured sessionMiddleware must be provided to createApp.');
  }

  const app = express();

  app.use(requestLoggingMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(sessionMiddleware);

  app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/open-finance', openFinanceRoutes);

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    logger.error('HTTP request failed', {
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      statusCode: status,
      errorMessage: err.message || 'Unexpected internal error.',
      errorDetails: err.details || null,
    });
    res.status(status).json({
      message: err.message || 'Unexpected internal error.',
      details: err.details || null,
    });
  });

  return app;
}

module.exports = {
  createApp,
};
