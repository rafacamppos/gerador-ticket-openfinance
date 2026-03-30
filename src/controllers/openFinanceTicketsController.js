const openFinanceService = require('../services/openFinanceService');
const logger = require('../utils/logger');
const { executeWithManagedSession } = require('./openFinanceControllerShared');

async function listTickets(req, res, next) {
  try {
    logger.info('Open Finance ticket list requested', {
      requestId: req.requestId || null,
      route: 'listTickets',
      ownerSlug: req.query?.ownerSlug || req.query?.owner_slug || null,
      assignedGroup: req.query?.assignedGroup || req.query?.assigned_group || null,
      problemType: req.query?.problemType || req.query?.problem_type || null,
      hasSessionCookie: Boolean(req.session?.openFinanceSession?.cookie),
      hasSessionCache: Boolean(req.session?.openFinanceSession?.cache),
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.listTickets(req.query, headers, context)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function listKnownTickets(req, res, next) {
  try {
    logger.info('Open Finance known ticket list requested', {
      requestId: req.requestId || null,
      route: 'listKnownTickets',
      ownerSlug: req.query?.ownerSlug || req.query?.owner_slug || null,
      currentOwnerSlug: req.query?.currentOwnerSlug || req.query?.current_owner_slug || null,
    });
    const response = await openFinanceService.listKnownTickets(req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getTicketById(req, res, next) {
  try {
    logger.info('Open Finance ticket detail requested', {
      requestId: req.requestId || null,
      route: 'getTicketById',
      ticketId: req.params.ticketId,
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.getTicketById(req.params.ticketId, headers, context)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicket(req, res, next) {
  try {
    logger.info('Open Finance ticket creation requested', {
      requestId: req.requestId || null,
      route: 'createTicket',
      template: req.query?.template || null,
      type: req.query?.type || '1',
      infoCount: Array.isArray(req.body?.info) ? req.body.info.length : 0,
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.createTicket(req.body, req.query, headers, context)
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function updateTicket(req, res, next) {
  try {
    logger.info('Open Finance ticket update requested', {
      requestId: req.requestId || null,
      route: 'updateTicket',
      ticketId: req.params.ticketId,
      infoCount: Array.isArray(req.body?.info) ? req.body.info.length : 0,
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.updateTicket(req.params.ticketId, req.body, headers, context)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicketAttachment(req, res, next) {
  try {
    logger.info('Open Finance ticket attachment requested', {
      requestId: req.requestId || null,
      route: 'createTicketAttachment',
      ticketId: req.params.ticketId,
      fileName: req.file?.originalname || null,
      fileSize: req.file?.size || null,
      mimeType: req.file?.mimetype || null,
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.createTicketAttachment(req.params.ticketId, req.file, headers, context)
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicketActivity(req, res, next) {
  try {
    logger.info('Open Finance ticket activity requested', {
      requestId: req.requestId || null,
      route: 'createTicketActivity',
      ticketId: req.params.ticketId,
      userId: req.body?.userId || null,
      fromTime: req.body?.fromTime || null,
      toTime: req.body?.toTime || null,
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.createTicketActivity(req.params.ticketId, req.body, headers, context)
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function downloadTicketAttachment(req, res, next) {
  try {
    logger.info('Open Finance ticket attachment download requested', {
      requestId: req.requestId || null,
      route: 'downloadTicketAttachment',
      ticketId: req.params.ticketId,
      fileId: req.params.fileId,
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.downloadTicketAttachment(
        req.params.ticketId,
        req.params.fileId,
        headers,
        context
      )
    );

    if (response.headers.contentType) {
      res.setHeader('Content-Type', response.headers.contentType);
    }

    if (response.headers.contentDisposition) {
      res.setHeader('Content-Disposition', response.headers.contentDisposition);
    }

    if (response.headers.contentLength) {
      res.setHeader('Content-Length', response.headers.contentLength);
    }

    res.status(200).send(response.buffer);
  } catch (error) {
    next(error);
  }
}

async function listRequiredTemplateFields(req, res, next) {
  try {
    logger.info('Open Finance required template fields requested', {
      requestId: req.requestId || null,
      route: 'listRequiredTemplateFields',
      templateId: req.params.templateId,
      type: req.query?.type || 'incident',
      view: req.query?.view || '1',
    });
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceService.listRequiredTemplateFields(
        req.params.templateId,
        req.query,
        headers,
        context
      )
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTicket,
  createTicketActivity,
  createTicketAttachment,
  downloadTicketAttachment,
  getTicketById,
  listKnownTickets,
  listRequiredTemplateFields,
  listTickets,
  updateTicket,
};
