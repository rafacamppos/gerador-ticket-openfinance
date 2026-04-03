const express = require('express');
const multer = require('multer');
const openFinanceAuthController = require('../controllers/openFinanceAuthController');
const openFinanceApplicationIncidentsController = require('../controllers/openFinanceApplicationIncidentsController');
const openFinanceEnvironmentController = require('../controllers/openFinanceEnvironmentController');
const openFinanceTicketFlowController = require('../controllers/openFinanceTicketFlowController');
const openFinanceTicketsController = require('../controllers/openFinanceTicketsController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/auth/sessions', openFinanceAuthController.createSession);
router.post('/auth/login', openFinanceAuthController.loginPortalUser);
router.get('/auth/me', openFinanceAuthController.getPortalSessionUser);
router.post('/auth/logout', openFinanceAuthController.logoutPortalUser);
router.get(
  '/:teamSlug/application-incidents',
  openFinanceApplicationIncidentsController.listApplicationIncidents
);
router.get(
  '/:teamSlug/application-incidents/:incidentId',
  openFinanceApplicationIncidentsController.getApplicationIncidentById
);
router.post(
  '/:teamSlug/application-incidents/:incidentId/assign-to-me',
  openFinanceApplicationIncidentsController.assignIncidentToMe
);
router.post(
  '/:teamSlug/application-incidents/:incidentId/transitions',
  openFinanceApplicationIncidentsController.transitionIncident
);
router.post(
  '/:teamSlug/application-incidents/:incidentId/create-ticket',
  openFinanceApplicationIncidentsController.createTicketFromIncident
);
router.post(
  '/:teamSlug/report-application-error',
  openFinanceApplicationIncidentsController.reportIncident
);
router.get('/environment', openFinanceEnvironmentController.getEnvironment);
router.put('/environment', openFinanceEnvironmentController.updateEnvironment);
router.get('/ticket-flows', openFinanceTicketFlowController.listTicketFlows);
router.get('/ticket-flows/:ticketId', openFinanceTicketFlowController.getTicketFlow);
router.post('/ticket-flows/:ticketId/transitions', openFinanceTicketFlowController.transitionTicketFlow);
router.get('/ticket-statuses', openFinanceTicketsController.listTicketStatuses);
router.get('/tickets/known', openFinanceTicketsController.listKnownTickets);
router.get('/tickets', openFinanceTicketsController.listTickets);
router.get('/tickets/:ticketId', openFinanceTicketsController.getTicketById);
router.get(
  '/tickets/:ticketId/attachments/:fileId/download',
  openFinanceTicketsController.downloadTicketAttachment
);
router.post('/tickets', openFinanceTicketsController.createTicket);
router.put('/tickets/:ticketId', openFinanceTicketsController.updateTicket);
router.post(
  '/tickets/:ticketId/attachments',
  upload.single('file'),
  openFinanceTicketsController.createTicketAttachment
);
router.post('/tickets/:ticketId/activities', openFinanceTicketsController.createTicketActivity);
router.get(
  '/ticket-templates/:templateId/required-fields',
  openFinanceTicketsController.listRequiredTemplateFields
);

module.exports = router;
