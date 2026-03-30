function resolveUserId(req) {
  return (
    req?.session?.portalUser?.id ||
    req?.session?.portalUser?.email ||
    req?.body?.userId ||
    req?.body?.user_id ||
    null
  );
}

function resolveTicketId(req, overrides = {}) {
  return (
    overrides.ticketId ||
    req?.params?.ticketId ||
    req?.body?.ticketId ||
    req?.body?.ticket_id ||
    req?.query?.ticketId ||
    req?.query?.ticket_id ||
    null
  );
}

function buildRequestLogContext(req, overrides = {}) {
  const context = {
    requestId: req?.requestId || null,
    userId: resolveUserId(req),
    ticketId: resolveTicketId(req, overrides),
    ...overrides,
  };

  if (context.ticketId === undefined) {
    context.ticketId = null;
  }

  return context;
}

module.exports = {
  buildRequestLogContext,
};
