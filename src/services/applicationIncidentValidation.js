const { buildError } = require('./openFinanceServiceErrors');
const {
  CATEGORY_DATA_FIELDS,
  TIPO_CLIENTE,
  CANAL_JORNADA,
} = require('../contracts/applicationIncidentContract');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HTTP_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
]);

function normalizeUuid(value, fieldName) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError(`Field "${fieldName}" is required.`);
  }

  if (!UUID_REGEX.test(normalizedValue)) {
    throw buildError(`Field "${fieldName}" must be a valid UUID.`);
  }

  return normalizedValue;
}

function normalizeTeamSlug(value) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError('Path param "teamSlug" is required.');
  }

  return normalizedValue;
}

function normalizeJsonPayload(value, fieldName) {
  if (!value || typeof value !== 'object') {
    throw buildError(`Field "${fieldName}" must be a valid JSON object or array.`);
  }

  return value;
}

function normalizeTipoCliente(value) {
  const normalizedValue = String(value || '').trim();
  const allowed = Object.values(TIPO_CLIENTE);

  if (!normalizedValue) {
    throw buildError(`Field "tipo_cliente" is required.`);
  }

  if (!allowed.includes(normalizedValue)) {
    throw buildError(`Field "tipo_cliente" must be one of: ${allowed.join(', ')}.`);
  }

  return normalizedValue;
}

function normalizeCanalJornada(value) {
  const normalizedValue = String(value || '').trim();
  const allowedKeys = Object.keys(CANAL_JORNADA);

  if (!normalizedValue) {
    throw buildError(`Field "canal_jornada" is required.`);
  }

  if (!allowedKeys.includes(normalizedValue)) {
    throw buildError(`Field "canal_jornada" must be one of: ${allowedKeys.join(', ')}.`);
  }

  return CANAL_JORNADA[normalizedValue];
}

function normalizeTitle(value) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError('Field "title" is required.');
  }

  if (normalizedValue.length > 255) {
    throw buildError('Field "title" must be at most 255 characters.');
  }

  return normalizedValue;
}

function normalizeDescription(value) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError('Field "description" is required.');
  }

  if (normalizedValue.length > 1024) {
    throw buildError('Field "description" must be at most 1024 characters.');
  }

  return normalizedValue;
}

function normalizeEndpoint(value) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError('Field "endpoint" is required.');
  }

  return normalizedValue;
}

function normalizeHttpMethod(value) {
  const normalizedValue = String(value || '').trim().toUpperCase();

  if (!normalizedValue) {
    throw buildError('Field "method" is required.');
  }

  if (!HTTP_METHODS.has(normalizedValue)) {
    throw buildError(
      `Field "method" must be a valid HTTP method (${Array.from(HTTP_METHODS).join(', ')}).`
    );
  }

  return normalizedValue;
}

function normalizeTimestamp(value) {
  if (value === null || value === undefined || value === '') {
    throw buildError('Field "occurred_at" is required.');
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw buildError('Field "occurred_at" is required.');
    }

    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) {
      throw buildError('Field "occurred_at" must be a valid timestamp.');
    }

    // Preserve local datetimes without timezone so Postgres can interpret them
    // using the configured database session timezone.
    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(normalizedValue)) {
      return normalizedValue.replace(' ', 'T');
    }

    return normalizedValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw buildError('Field "occurred_at" must be a valid timestamp.');
  }

  return date.toISOString();
}

function normalizeHttpStatusCode(value) {
  const normalizedValue = Number(value);

  if (!Number.isInteger(normalizedValue)) {
    throw buildError('Field "http_status_code" must be an integer HTTP status code.');
  }

  if (normalizedValue < 100 || normalizedValue > 599) {
    throw buildError('Field "http_status_code" must be between 100 and 599.');
  }

  return normalizedValue;
}

function normalizeRelatedTicketId(value, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw buildError('Field "related_ticket_id" is required.');
    }

    return null;
  }

  const normalizedValue = Number(value);
  if (!Number.isInteger(normalizedValue) || normalizedValue <= 0) {
    throw buildError('Field "related_ticket_id" must be a valid ticket number.');
  }

  return normalizedValue;
}

function normalizeIdVersionApi(value, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw buildError('Field "id_version_api" is required.');
    }

    return null;
  }

  const normalizedValue = Number(value);
  if (!Number.isInteger(normalizedValue) || normalizedValue <= 0) {
    throw buildError('Field "id_version_api" must be a positive integer.');
  }

  return normalizedValue;
}

function normalizeCategoryName(value, fieldName = CATEGORY_DATA_FIELDS.CATEGORY_NAME) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError(`Field "${fieldName}" is required.`);
  }

  if (normalizedValue.length > 255) {
    throw buildError(`Field "${fieldName}" must be at most 255 characters.`);
  }

  return normalizedValue;
}

function normalizeSubCategoryName(value, fieldName = CATEGORY_DATA_FIELDS.SUB_CATEGORY_NAME) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError(`Field "${fieldName}" is required.`);
  }

  if (normalizedValue.length > 255) {
    throw buildError(`Field "${fieldName}" must be at most 255 characters.`);
  }

  return normalizedValue;
}

function normalizeThirdLevelCategoryName(
  value,
  fieldName = CATEGORY_DATA_FIELDS.THIRD_LEVEL_CATEGORY_NAME
) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    throw buildError(`Field "${fieldName}" is required.`);
  }

  if (normalizedValue.length > 255) {
    throw buildError(`Field "${fieldName}" must be at most 255 characters.`);
  }

  return normalizedValue;
}

function normalizeCategoryData(value, fallback = {}) {
  if (
    value !== null &&
    value !== undefined &&
    (typeof value !== 'object' || Array.isArray(value))
  ) {
    throw buildError('Field "category_data" must be a valid JSON object.');
  }

  const source = value || fallback;

  return {
    category_name: normalizeCategoryName(
      source.category_name,
      'category_data.category_name'
    ),
    sub_category_name: normalizeSubCategoryName(
      source.sub_category_name,
      'category_data.sub_category_name'
    ),
    third_level_category_name: normalizeThirdLevelCategoryName(
      source.third_level_category_name,
      'category_data.third_level_category_name'
    ),
  };
}

/**
 * Valida e normaliza o payload base completo
 * Retorna um objeto com todos os campos validados
 */
function validateAndNormalizePayloadBase(payload) {
  if (!payload || typeof payload !== 'object') {
    throw buildError('Payload must be a valid JSON object.');
  }

  return {
    x_fapi_interaction_id: normalizeUuid(
      payload.x_fapi_interaction_id,
      'x_fapi_interaction_id'
    ),
    authorization_server: normalizeUuid(
      payload.authorization_server,
      'authorization_server'
    ),
    client_id: normalizeUuid(payload.client_id, 'client_id'),
    endpoint: normalizeEndpoint(payload.endpoint),
    category_data: normalizeCategoryData(payload.category_data),
    id_version_api: normalizeIdVersionApi(payload.id_version_api, { required: true }),
    http_method: normalizeHttpMethod(payload.http_method),
    payload_request: normalizeJsonPayload(payload.payload_request, 'payload_request'),
    payload_response: normalizeJsonPayload(payload.payload_response, 'payload_response'),
    occurred_at: normalizeTimestamp(payload.occurred_at),
    description: normalizeDescription(payload.description),
    title: normalizeTitle(payload.title),
    canal_jornada: normalizeCanalJornada(payload.canal_jornada),
    tipo_cliente: normalizeTipoCliente(payload.tipo_cliente),
    http_status_code: normalizeHttpStatusCode(payload.http_status_code),
  };
}

module.exports = {
  normalizeCanalJornada,
  normalizeCategoryData,
  normalizeCategoryName,
  normalizeDescription,
  normalizeIdVersionApi,
  normalizeSubCategoryName,
  normalizeThirdLevelCategoryName,
  normalizeTitle,
  normalizeTipoCliente,
  normalizeEndpoint,
  normalizeHttpMethod,
  normalizeHttpStatusCode,
  normalizeJsonPayload,
  normalizeRelatedTicketId,
  normalizeTeamSlug,
  normalizeTimestamp,
  normalizeUuid,
  validateAndNormalizePayloadBase,
};
