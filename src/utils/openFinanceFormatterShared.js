function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'sim', 'yes', '1', 'y'].includes(normalized)) {
      return true;
    }
    if (['false', 'nao', 'não', 'no', '0', 'n', '2'].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function mapEscopo(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === '1') {
    return 'Bilateral';
  }
  if (normalized === '2') {
    return 'Não bilateral';
  }

  return String(value);
}

function mapTipoCliente(value) {
  if (value === null || value === undefined || value === '') {
    return [];
  }

  const values = Array.isArray(value) ? value : String(value).split(/[;,|]/).map((item) => item.trim());

  return values
    .filter(Boolean)
    .map((item) => {
      const normalized = String(item).trim().toLowerCase();
      if (normalized === '1') {
        return 'PF';
      }
      if (normalized === '2') {
        return 'PJ';
      }
      return String(item);
    });
}

function normalizeDateTime(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return null;
  }

  if (/^\d+$/.test(rawValue)) {
    return new Date(Number(rawValue)).toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(rawValue)) {
    return rawValue;
  }

  const match = rawValue.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const [, day, month, year, hour, minute, second = '00'] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  return rawValue;
}

function normalizeMillis(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const rawValue = String(value).trim();
  if (/^\d+$/.test(rawValue)) {
    return Number(rawValue);
  }

  return null;
}

function tryParseJson(value) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeApiPayload(value) {
  const parsed = tryParseJson(value);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      headers: {},
      payload: {},
    };
  }

  const headers =
    parsed.headers && typeof parsed.headers === 'object' && !Array.isArray(parsed.headers)
      ? parsed.headers
      : {};

  const payload =
    parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload)
      ? parsed.payload
      : {};

  return {
    headers,
    payload,
  };
}

function summarizeDescription(value) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const normalized = value.replace(/\r/g, '').trim();
  if (!normalized) {
    return null;
  }

  if (/ao tentar realizar a coleta de dados de conta para o consentimento/i.test(normalized)) {
    return 'Erro ao coletar dados de conta para consentimento';
  }

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function normalizeDescriptionFull(value) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const normalized = value.replace(/\r/g, '').trim();
  return normalized || null;
}

module.exports = {
  asArray,
  mapEscopo,
  mapTipoCliente,
  normalizeApiPayload,
  normalizeDateTime,
  normalizeDescriptionFull,
  normalizeKey,
  normalizeMillis,
  summarizeDescription,
  toBoolean,
  tryParseJson,
};
