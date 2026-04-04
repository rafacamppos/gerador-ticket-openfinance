const { buildError } = require('./openFinanceServiceErrors');
const { TIPO_CLIENTE, CANAL_JORNADA } = require('../contracts/applicationIncidentContract');

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
  const allowed = Object.values(CANAL_JORNADA);

  if (!normalizedValue) {
    throw buildError(`Field "canal_jornada" is required.`);
  }

  if (!allowed.includes(normalizedValue)) {
    throw buildError(`Field "canal_jornada" must be one of: ${allowed.join(', ')}.`);
  }

  return normalizedValue;
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

module.exports = {
  normalizeCanalJornada,
  normalizeDescription,
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
};
