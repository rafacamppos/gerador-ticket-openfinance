const { asArray, normalizeKey } = require('./openFinanceFormatterShared');

function buildDirectFieldMap(ticket = {}) {
  const fieldMap = new Map();

  for (const [key, value] of Object.entries(ticket || {})) {
    fieldMap.set(normalizeKey(key), value);
  }

  return fieldMap;
}

function getPreferredInfoValue(entry = {}) {
  if (Array.isArray(entry.value)) {
    return entry.value;
  }

  if (entry.valueCaption !== undefined && entry.valueCaption !== null && entry.valueCaption !== '') {
    return entry.valueCaption;
  }

  return entry.value ?? entry.displayValue ?? entry.text ?? entry.content ?? entry.rawValue ?? null;
}

function buildInfoFieldMap(ticket = {}) {
  const fieldMap = new Map();
  const entries = [...asArray(ticket.info), ...asArray(ticket.fields), ...asArray(ticket.customFields)];

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const aliases = [entry.key, entry.keyCaption, entry.name, entry.label, entry.fieldName].filter(Boolean);
    if (!aliases.length) {
      continue;
    }

    const preferredValue = getPreferredInfoValue(entry);
    for (const alias of aliases) {
      fieldMap.set(normalizeKey(alias), preferredValue);
    }
  }

  return fieldMap;
}

function getField(directFieldMap, infoFieldMap, aliases, fallback = null) {
  for (const alias of aliases) {
    const normalized = normalizeKey(alias);

    if (infoFieldMap.has(normalized)) {
      const value = infoFieldMap.get(normalized);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    if (directFieldMap.has(normalized)) {
      const value = directFieldMap.get(normalized);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }

  return fallback;
}

module.exports = {
  buildDirectFieldMap,
  buildInfoFieldMap,
  getField,
  getPreferredInfoValue,
};
