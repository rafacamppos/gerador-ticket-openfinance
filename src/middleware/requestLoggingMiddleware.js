const logger = require('../utils/logger');
const { buildRequestLogContext } = require('../utils/requestLogContext');

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
}

function requestLoggingMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || logger.createRequestId();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  logger.info('HTTP request started', {
    ...buildRequestLogContext(req),
    method: req.method,
    path: req.originalUrl,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
  });

  res.on('finish', () => {
    logger.info('HTTP request completed', {
      ...buildRequestLogContext(req),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}

module.exports = requestLoggingMiddleware;
