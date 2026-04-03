const test = require('node:test');
const assert = require('node:assert');

const { createApp } = require('../../src/app');
const { createInMemoryTestSessionMiddleware } = require('../../src/middleware/sessionMiddleware');

function collectRoutes(stack, prefix = '') {
  const routes = [];

  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .map((method) => method.toUpperCase())
        .sort()
        .join(',');
      routes.push(`${methods} ${prefix}${layer.route.path}`);
      continue;
    }

    if (layer.name === 'router' && layer.handle && Array.isArray(layer.handle.stack)) {
      const pathPart = layer.regexp && layer.regexp.toString()
        .replace('/^\\', '')
        .replace('\\/?(?=\\/|$)/i', '')
        .replace(/\\$$/, '')
        .replace(/\\\\\//g, '/')
        .replace(/\\\//g, '/');
      const normalizedPrefix =
        pathPart && pathPart !== '(?=\\/|$)' ? `${prefix}${pathPart}` : prefix;
      routes.push(...collectRoutes(layer.handle.stack, normalizedPrefix));
    }
  }

  return routes.sort();
}

test('app registers the expected HTTP routes', () => {
  const app = createApp({
    sessionMiddleware: createInMemoryTestSessionMiddleware(),
  });
  const routes = collectRoutes(app._router.stack);

  assert.deepStrictEqual(routes, [
    'GET /api/v1/open-finance/:teamSlug/application-incidents',
    'GET /api/v1/open-finance/:teamSlug/application-incidents/:incidentId',
    'GET /api/v1/open-finance/auth/me',
    'GET /api/v1/open-finance/environment',
    'GET /api/v1/open-finance/ticket-flows',
    'GET /api/v1/open-finance/ticket-flows/:ticketId',
    'GET /api/v1/open-finance/ticket-statuses',
    'GET /api/v1/open-finance/ticket-templates/:templateId/required-fields',
    'GET /api/v1/open-finance/tickets',
    'GET /api/v1/open-finance/tickets/:ticketId',
    'GET /api/v1/open-finance/tickets/:ticketId/attachments/:fileId/download',
    'GET /api/v1/open-finance/tickets/known',
    'GET /health',
    'POST /api/v1/open-finance/:teamSlug/application-incidents/:incidentId/assign-to-me',
    'POST /api/v1/open-finance/:teamSlug/application-incidents/:incidentId/create-ticket',
    'POST /api/v1/open-finance/:teamSlug/application-incidents/:incidentId/transitions',
    'POST /api/v1/open-finance/:teamSlug/report-application-error',
    'POST /api/v1/open-finance/auth/login',
    'POST /api/v1/open-finance/auth/logout',
    'POST /api/v1/open-finance/auth/sessions',
    'POST /api/v1/open-finance/ticket-flows/:ticketId/transitions',
    'POST /api/v1/open-finance/tickets',
    'POST /api/v1/open-finance/tickets/:ticketId/activities',
    'POST /api/v1/open-finance/tickets/:ticketId/attachments',
    'PUT /api/v1/open-finance/environment',
    'PUT /api/v1/open-finance/tickets/:ticketId',
  ]);
});
