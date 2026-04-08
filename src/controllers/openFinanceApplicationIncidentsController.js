const openFinanceApplicationIncidentsService = require('../services/openFinanceApplicationIncidentsService');
const openFinanceIncidentTicketService = require('../services/openFinanceIncidentTicketService');
const { executeWithManagedSession } = require('./openFinanceControllerShared');

async function listApplicationIncidents(req, res, next) {
  try {
    const limit = req.query?.limit ? Number(req.query.limit) : null;
    const offset = req.query?.offset ? Number(req.query.offset) : 0;
    const response = await openFinanceApplicationIncidentsService.listApplicationIncidents(
      req.params.teamSlug,
      { limit, offset }
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getApplicationIncidentById(req, res, next) {
  try {
    const response = await openFinanceApplicationIncidentsService.getApplicationIncidentById(
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
    const response = await openFinanceApplicationIncidentsService.reportApplicationIncident(req.params.teamSlug, req.body);

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function assignIncidentToMe(req, res, next) {
  try {
    const portalUser = req.session?.portalUser || null;

    const response = await openFinanceApplicationIncidentsService.assignApplicationIncidentToUser(
      req.params.teamSlug,
      req.params.incidentId,
      {
        assigned_to_user_id: portalUser?.id || null,
      }
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function transitionIncident(req, res, next) {
  try {
    const response = await openFinanceApplicationIncidentsService.transitionApplicationIncident(
      req.params.teamSlug,
      req.params.incidentId,
      req.body
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getTicketPreview(req, res, next) {
  try {
    const response = await openFinanceIncidentTicketService.getTicketPreview(
      req.params.teamSlug,
      req.params.incidentId
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicketFromIncident(req, res, next) {
  try {
    const portalUser = req.session?.portalUser || null;
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceIncidentTicketService.createTicketFromIncident(
        req.params.teamSlug,
        req.params.incidentId,
        req.body,
        headers,
        context,
        {
          authenticated_user_id: portalUser?.id || null,
          authenticated_user_email: portalUser?.email || null,
        }
      )
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  assignIncidentToMe,
  createTicketFromIncident,
  getApplicationIncidentById,
  getTicketPreview,
  listApplicationIncidents,
  reportIncident,
  transitionIncident,
};
