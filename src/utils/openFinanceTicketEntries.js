const {
  asArray,
  normalizeDateTime,
  normalizeMillis,
} = require('./openFinanceFormatterShared');
const { getPreferredInfoValue } = require('./openFinanceFieldMap');

function collectRawFields(ticket = {}) {
  const allowedKeys = new Set(['CustomColumn68sr', 'CustomColumn70sr', 'CustomColumn156sr']);

  return asArray(ticket.info)
    .filter((entry) => entry && typeof entry === 'object' && entry.key)
    .filter((entry) => allowedKeys.has(entry.key))
    .map((entry) => ({
      key: entry.key,
      label: entry.keyCaption || entry.label || entry.name || entry.fieldName || entry.key,
      value: getPreferredInfoValue(entry),
    }));
}

function normalizeActivity(entry = {}) {
  return {
    id: entry.id ?? null,
    user_name: entry.userName ?? entry.user_name ?? null,
    description: entry.description ?? null,
    logged_at: normalizeDateTime(entry.fullLogDateTime ?? entry.logTime ?? null),
    logged_at_ms: normalizeMillis(entry.logTime ?? null),
    type: entry.type ?? null,
  };
}

function normalizeNote(entry = {}) {
  return {
    user_name: entry.userName ?? entry.user_name ?? entry.user ?? null,
    create_date: normalizeDateTime(entry.createDate ?? entry.create_date ?? null),
    create_date_ms: normalizeMillis(entry.createDate ?? entry.create_date ?? null),
    text: entry.text ?? entry.note ?? null,
  };
}

function normalizeAttachment(entry = {}, parentTicketId = null, serviceDeskBaseUrl = null) {
  const fileId = entry.fileId ?? entry.file_id ?? entry.id ?? null;
  const ticketId =
    entry.srID ?? entry.srId ?? entry.ticketId ?? entry.ticket_id ?? parentTicketId ?? null;

  return {
    id: entry.id ?? null,
    file_id: fileId,
    file_name: entry.name ?? entry.fileName ?? entry.filename ?? null,
    real_file_name: entry.realFileName ?? entry.real_file_name ?? null,
    file_date: normalizeDateTime(entry.fileDate ?? entry.file_date ?? entry.createDate ?? entry.createdAt ?? null),
    ticket_id: ticketId ? String(ticketId) : null,
    download_url:
      serviceDeskBaseUrl && fileId && ticketId
        ? `${serviceDeskBaseUrl}/getFile?table=service_req&id=${encodeURIComponent(
            String(ticketId)
          )}&getFile=${encodeURIComponent(String(fileId))}`
        : null,
    name: entry.name ?? entry.fileName ?? entry.filename ?? null,
    content_type: entry.contentType ?? entry.mimeType ?? null,
    size: entry.size ?? null,
    created_at: normalizeDateTime(entry.createDate ?? entry.createdAt ?? null),
    created_at_ms: normalizeMillis(entry.createDate ?? entry.createdAt ?? null),
  };
}

module.exports = {
  collectRawFields,
  normalizeActivity,
  normalizeAttachment,
  normalizeNote,
};
