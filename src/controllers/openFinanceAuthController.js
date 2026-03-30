const openFinanceService = require('../services/openFinanceService');
const logger = require('../utils/logger');
const {
  getRequestContext,
  persistSession,
} = require('./openFinanceControllerShared');

async function createSession(req, res, next) {
  try {
    logger.info('Open Finance session creation requested', {
      requestId: req.requestId || null,
      route: 'createSession',
      userName: req.body?.userName || req.body?.user_name || null,
    });
    const response = await openFinanceService.createSession(req.body, getRequestContext(req));
    req.session.openFinanceSession = response.sessionState;
    await persistSession(req);
    logger.info('Open Finance session stored', {
      requestId: req.requestId || null,
      route: 'createSession',
      hasCookie: Boolean(response.sessionState?.cookie),
      hasCache: Boolean(response.sessionState?.cache),
    });
    res.status(200).json(response.response);
  } catch (error) {
    next(error);
  }
}

async function loginPortalUser(req, res, next) {
  try {
    const user = await openFinanceService.loginPortalUser(req.body);
    req.session.portalUser = user;
    await persistSession(req);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function getPortalSessionUser(req, res, next) {
  try {
    const user = openFinanceService.getPortalSessionUser(req.session);

    if (!user) {
      res.status(401).json({
        message: 'Usuário não autenticado.',
      });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function logoutPortalUser(req, res, next) {
  try {
    req.session.portalUser = null;
    await persistSession(req);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSession,
  loginPortalUser,
  getPortalSessionUser,
  logoutPortalUser,
};
