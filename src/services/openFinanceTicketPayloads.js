const { buildError } = require('./openFinanceServiceErrors');

function ensureTicketCreationPayload(payload = {}) {
  const info = Array.isArray(payload.info) ? payload.info : [];

  if (!info.length) {
    throw buildError('Field "info" must contain at least one entry.');
  }

  return {
    info,
  };
}

function ensureTicketUpdatePayload(ticketId, payload = {}) {
  const info = Array.isArray(payload.info) ? payload.info : [];

  if (!info.length) {
    throw buildError('Field "info" must contain at least one entry.');
  }

  return {
    id: payload.id || ticketId,
    info,
  };
}

function ensureActivityPayload(ticketId, payload = {}) {
  const userId = payload.userId;
  const fromTime = payload.fromTime;
  const toTime = payload.toTime;
  const description = String(payload.description || '').trim();

  if (!userId) {
    throw buildError('Field "userId" is required.');
  }

  if (!fromTime || !toTime) {
    throw buildError('Fields "fromTime" and "toTime" are required.');
  }

  if (!description) {
    throw buildError('Field "description" is required.');
  }

  return {
    id: payload.id || ticketId,
    userId,
    fromTime,
    toTime,
    description,
  };
}

module.exports = {
  ensureActivityPayload,
  ensureTicketCreationPayload,
  ensureTicketUpdatePayload,
};
