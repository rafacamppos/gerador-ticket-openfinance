const openFinanceAuthService = require('./openFinanceAuthService');
const openFinanceApplicationIncidentsService = require('./openFinanceApplicationIncidentsService');
const openFinanceTicketsService = require('./openFinanceTicketsService');
const openFinanceTemplatesService = require('./openFinanceTemplatesService');
const ticketFlowService = require('./ticketFlowService');
const portalAuthService = require('./portalAuthService');
const ticketStatusService = require('./ticketStatusService');

module.exports = {
  ...openFinanceApplicationIncidentsService,
  ...openFinanceAuthService,
  ...openFinanceTicketsService,
  ...openFinanceTemplatesService,
  ...ticketFlowService,
  ...portalAuthService,
  ...ticketStatusService,
};
