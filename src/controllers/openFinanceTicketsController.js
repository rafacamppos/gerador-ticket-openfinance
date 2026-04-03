const openFinanceTicketsService = require('../services/openFinanceTicketsService');
const openFinanceTemplatesService = require('../services/openFinanceTemplatesService');
const ticketStatusService = require('../services/ticketStatusService');
const logger = require('../utils/logger');
const { executeWithManagedSession } = require('./openFinanceControllerShared');

async function listTickets(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.listTickets(req.query, headers, context)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function listKnownTickets(req, res, next) {
  try {
    const response = await openFinanceTicketsService.listKnownTickets(req.query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function listTicketStatuses(req, res, next) {
  try {
    const response = await ticketStatusService.listTicketStatuses();
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function getTicketById(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.getTicketById(req.params.ticketId, headers, context)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicket(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.createTicket(req.body, req.query, headers, context)
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function updateTicket(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.updateTicket(req.params.ticketId, req.body, headers, context)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicketAttachment(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.createTicketAttachment(req.params.ticketId, req.file, headers, context)
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function createTicketActivity(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.createTicketActivity(req.params.ticketId, req.body, headers, context)
    );
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

async function downloadTicketAttachment(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTicketsService.downloadTicketAttachment(
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

    logger.info('Open Finance ticket attachment downloaded', {
      ticketId: req.params.ticketId,
      fileId: req.params.fileId,
      fileName: response.headers.contentDisposition || null,
      fileSize: response.headers.contentLength || null,
    });

    res.status(200).send(response.buffer);
  } catch (error) {
    next(error);
  }
}

async function listRequiredTemplateFields(req, res, next) {
  try {
    const response = await executeWithManagedSession(req, (headers, context) =>
      openFinanceTemplatesService.listRequiredTemplateFields(
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
  listTicketStatuses,
  listRequiredTemplateFields,
  listTickets,
  updateTicket,
};
