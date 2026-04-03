const openFinanceDeskClient = require('../clients/openFinanceDeskClient');
const { getServiceDeskBaseUrl } = require('../clients/openFinanceDeskClient');
const {
  formatTicket,
  formatTicketList,
} = require('../utils/openFinanceTicketFormatter');
const ticketOwnerClassificationService = require('./ticketOwnerClassificationService');
const ticketFlowService = require('./ticketFlowService');
const { buildError } = require('./openFinanceServiceErrors');
const {
  ensureActivityPayload,
  ensureTicketCreationPayload,
  ensureTicketUpdatePayload,
} = require('./openFinanceTicketPayloads');
const {
  normalizeTicketCreationQuery,
  normalizeTicketListQuery,
  resolveOwnerSlugFilter,
  resolveTicketListOwner,
  resolveTicketStatusFilter,
  shouldHideFromOperationalQueue,
} = require('./openFinanceTicketQuery');

async function listTickets(query, headers, context) {
  const response = await openFinanceDeskClient.getJson(
    '/sr',
    normalizeTicketListQuery(query),
    headers,
    context
  );
  let formattedTickets = await ticketOwnerClassificationService.classifyTickets(
    formatTicketList(response, {
      serviceDeskBaseUrl: getServiceDeskBaseUrl(context),
    })
  );
  await ticketFlowService.syncTicketFlows(formattedTickets);
  formattedTickets = await ticketFlowService.attachFlowStates(formattedTickets);
  const statusFilter = resolveTicketStatusFilter(query);
  const ownerSlugFilter = resolveOwnerSlugFilter(query);

  if (ownerSlugFilter) {
    formattedTickets = formattedTickets.filter(
      (ticket) => resolveTicketListOwner(ticket) === ownerSlugFilter
    );
  }

  if (!statusFilter) {
    return formattedTickets.filter((ticket) => !shouldHideFromOperationalQueue(ticket));
  }

  return formattedTickets.filter((ticket) => ticket?.ticket?.status === statusFilter);
}

async function listKnownTickets(query = {}) {
  const ticketFlowService = require('./ticketFlowService');

  return ticketFlowService.listTicketFlows({
    currentOwnerSlug: query.ownerSlug || query.owner_slug || query.currentOwnerSlug || query.current_owner_slug || null,
    currentStage: query.currentStage || query.current_stage || null,
    acceptedByTeam: query.acceptedByTeam || query.accepted_by_team,
    respondedByTeam: query.respondedByTeam || query.responded_by_team,
    returnedToSu: query.returnedToSu || query.returned_to_su,
  });
}

async function getTicketById(ticketId, headers, context) {
  const response = await openFinanceDeskClient.getJson(
    `/sr/${ticketId}`,
    undefined,
    headers,
    context
  );
  const ticket = await ticketOwnerClassificationService.classifyTicket(
    formatTicket(response, {
      serviceDeskBaseUrl: getServiceDeskBaseUrl(context),
    })
  );
  await ticketFlowService.syncTicketFlows([ticket]);
  const [enrichedTicket] = await ticketFlowService.attachFlowStates([ticket]);
  return enrichedTicket;
}

async function createTicket(payload, query, headers, context) {
  const normalizedQuery = normalizeTicketCreationQuery(query);
  if (!normalizedQuery.template) {
    throw buildError('Query param "template" is required to create a ticket.');
  }

  return openFinanceDeskClient.postJson(
    '/sr',
    ensureTicketCreationPayload(payload),
    normalizedQuery,
    headers,
    context
  );
}

async function updateTicket(ticketId, payload, headers, context) {
  return openFinanceDeskClient.putJson(
    `/sr/${ticketId}`,
    ensureTicketUpdatePayload(ticketId, payload),
    headers,
    context
  );
}

async function createTicketAttachment(ticketId, file, headers, context) {
  if (!file) {
    throw buildError('Multipart field "file" is required.');
  }

  return openFinanceDeskClient.postMultipart(`/sr/${ticketId}/attachment`, file, headers, context);
}

async function createTicketActivity(ticketId, payload, headers, context) {
  return openFinanceDeskClient.postJson(
    `/sr/${ticketId}/activity`,
    ensureActivityPayload(ticketId, payload),
    undefined,
    headers,
    context
  );
}

async function downloadTicketAttachment(ticketId, fileId, headers, context) {
  if (!ticketId) {
    throw buildError('Path param "ticketId" is required.');
  }

  if (!fileId) {
    throw buildError('Path param "fileId" is required.');
  }

  const serviceDeskBaseUrl = getServiceDeskBaseUrl(context);
  const url =
    `${serviceDeskBaseUrl}/getFile?table=service_req&id=${encodeURIComponent(ticketId)}` +
    `&getFile=${encodeURIComponent(fileId)}`;

  return openFinanceDeskClient.downloadBinary(url, headers);
}

module.exports = {
  listTickets,
  listKnownTickets,
  getTicketById,
  createTicket,
  updateTicket,
  createTicketAttachment,
  createTicketActivity,
  downloadTicketAttachment,
};
