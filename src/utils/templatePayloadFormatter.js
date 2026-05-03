/**
 * Formata o payload dos campos do template para o formato esperado
 * Transforma a resposta do endpoint /templates/:templateId/fields
 * em um objeto com context_key -> field_name
 */
function formatTemplatePayload(templateFieldsResponse) {
  if (!templateFieldsResponse || !templateFieldsResponse.data || !templateFieldsResponse.data.fields) {
    return { data: {} };
  }

  const fields = templateFieldsResponse.data.fields;
  const formattedData = {};

  fields.forEach(field => {
    formattedData[field.context_key] = field.field_name;
  });

  return {
    data: formattedData
  };
}

/**
 * Formata para JSON com indentação (4 espaços)
 */
function formatTemplatePayloadAsJSON(templateFieldsResponse) {
  const formatted = formatTemplatePayload(templateFieldsResponse);
  return JSON.stringify(formatted, null, 4);
}

module.exports = {
  formatTemplatePayload,
  formatTemplatePayloadAsJSON
};
