const { frontendOrigin } = require('../config/env');

function corsMiddleware(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache, X-Request-Id'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

module.exports = corsMiddleware;
