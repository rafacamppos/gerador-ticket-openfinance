const openFinanceDeskClient = require('../clients/openFinanceDeskClient');

function normalizeTemplateQuery(templateId, query = {}) {
  return {
    type: query.type || 'incident',
    template: query.template || templateId,
    view: query.view || '1',
  };
}

async function listRequiredTemplateFields(templateId, query, headers, context) {
  return openFinanceDeskClient.getJson(
    '/sr/template',
    normalizeTemplateQuery(templateId, query),
    headers,
    context
  );
}

module.exports = {
  listRequiredTemplateFields,
};
