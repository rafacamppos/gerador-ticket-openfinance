const logger = require('../utils/logger');
const {
  formatEnvironmentState,
  listAvailableEnvironments,
  persistSession,
  resolveEnvironment,
  storeOpenFinanceSession,
} = require('./openFinanceControllerShared');

async function getEnvironment(req, res, next) {
  try {
    res.status(200).json(formatEnvironmentState(req));
  } catch (error) {
    next(error);
  }
}

async function updateEnvironment(req, res, next) {
  try {
    const nextEnvironment =
      resolveEnvironment(req.body?.environmentKey) ||
      resolveEnvironment(req.body?.environment) ||
      resolveEnvironment(req.body?.baseUrl);

    if (!nextEnvironment) {
      res.status(400).json({
        message: 'Ambiente Open Finance inválido.',
        details: listAvailableEnvironments(),
      });
      return;
    }

    req.session.openFinanceEnvironmentBaseUrl = nextEnvironment.baseUrl;
    storeOpenFinanceSession(req, null);
    await persistSession(req);

    logger.info('Open Finance environment updated', {
      requestId: req.requestId || null,
      route: 'updateEnvironment',
      environmentKey: nextEnvironment.key,
      environmentBaseUrl: nextEnvironment.baseUrl,
    });

    res.status(200).json(formatEnvironmentState(req));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEnvironment,
  updateEnvironment,
};
