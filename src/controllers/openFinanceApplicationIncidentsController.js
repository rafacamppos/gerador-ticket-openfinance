const logger = require('../utils/logger');
const openFinanceService = require('../services/openFinanceService');

async function listApplicationIncidents(req, res, next) {
  try {
    logger.info('Open Finance application incidents requested', {
      requestId: req.requestId || null,
      route: 'listApplicationIncidents',
      teamSlug: req.params.teamSlug,
      userId: req.session?.portalUser?.id || req.session?.portalUser?.email || null,
    });

    const response = await openFinanceService.listApplicationIncidents(req.params.teamSlug);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getApplicationIncidentById(req, res, next) {
  try {
    logger.info('Open Finance application incident detail requested', {
      requestId: req.requestId || null,
      route: 'getApplicationIncidentById',
      teamSlug: req.params.teamSlug,
      incidentId: req.params.incidentId,
      userId: req.session?.portalUser?.id || req.session?.portalUser?.email || null,
    });

    const response = await openFinanceService.getApplicationIncidentById(
      req.params.teamSlug,
      req.params.incidentId
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function reportIncident(req, res, next) {
  try {
    logger.info('Open Finance application incident reported', {
      requestId: req.requestId || null,
      route: 'reportIncident',
      teamSlug: req.params.teamSlug,
      userId: req.session?.portalUser?.id || req.session?.portalUser?.email || null,
      clientId: req.body?.client_id ?? null,
      endpoint: req.body?.endpoint ?? null,
      method: req.body?.method ?? null,
      httpStatusCode: req.body?.http_status_code ?? null,
    });

    const response = await openFinanceService.reportApplicationIncident(req.params.teamSlug, req.body);

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function assignIncidentToMe(req, res, next) {
  try {
    const portalUser = req.session?.portalUser || null;

    logger.info('Open Finance application incident assigned to current user', {
      requestId: req.requestId || null,
      route: 'assignIncidentToMe',
      teamSlug: req.params.teamSlug,
      incidentId: req.params.incidentId,
      userId: portalUser?.id || portalUser?.email || null,
    });

    const response = await openFinanceService.assignApplicationIncidentToUser(
      req.params.teamSlug,
      req.params.incidentId,
      {
        assigned_to_user_id: portalUser?.id || null,
        assigned_to_name: portalUser?.name || null,
        assigned_to_email: portalUser?.email || null,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function transitionIncident(req, res, next) {
  try {
    const portalUser = req.session?.portalUser || null;

    logger.info('Open Finance application incident transitioned', {
      requestId: req.requestId || null,
      route: 'transitionIncident',
      teamSlug: req.params.teamSlug,
      incidentId: req.params.incidentId,
      incidentStatus: req.body?.incident_status ?? null,
      relatedTicketId: req.body?.related_ticket_id ?? null,
      userId: portalUser?.id || portalUser?.email || null,
    });

    const response = await openFinanceService.transitionApplicationIncident(
      req.params.teamSlug,
      req.params.incidentId,
      req.body
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  assignIncidentToMe,
  getApplicationIncidentById,
  listApplicationIncidents,
  reportIncident,
  transitionIncident,
};
