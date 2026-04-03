const ticketFlowService = require('../services/ticketFlowService');

async function listTicketFlows(req, res, next) {
  try {
    const response = await ticketFlowService.listTicketFlows(req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getTicketFlow(req, res, next) {
  try {
    const response = await ticketFlowService.getTicketFlow(req.params.ticketId);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function transitionTicketFlow(req, res, next) {
  try {
    const sessionUser = req.session?.portalUser || null;
    const response = await ticketFlowService.transitionTicketFlow(
      req.params.ticketId,
      {
        ...req.body,
        actorName: sessionUser?.name || req.body?.actorName || req.body?.actor_name,
        actorEmail: sessionUser?.email || req.body?.actorEmail || req.body?.actor_email,
      }
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTicketFlow,
  listTicketFlows,
  transitionTicketFlow,
};
