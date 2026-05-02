const { buildError } = require('./openFinanceServiceErrors');

function getTicketUserRepository() {
  return require('../repositories/ticketUserRepository');
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id ? String(user.id) : null,
    name: user.name || null,
    email: user.email || null,
    profile: user.profile || null,
    team: {
      id: user.ticket_owner_id ? String(user.ticket_owner_id) : null,
      slug: user.owner_slug || null,
      name: user.owner_name || null,
    },
  };
}

async function loginPortalUser(payload = {}) {
  const email = String(payload.email || '').trim().toLowerCase();

  if (!email) {
    throw buildError('Field "email" is required.', 400);
  }

  const repository = getTicketUserRepository();
  const user = await repository.findActiveUserByEmail(email);

  if (!user) {
    throw buildError('Credenciais inválidas.', 401);
  }

  return normalizeUser(user);
}

function getPortalSessionUser(session = {}) {
  return session.portalUser || null;
}

module.exports = {
  getPortalSessionUser,
  loginPortalUser,
};
