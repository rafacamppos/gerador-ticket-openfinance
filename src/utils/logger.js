const crypto = require('crypto');

function createRequestId() {
  return crypto.randomUUID();
}

function buildLogEntry(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
}

function writeLog(level, message, context) {
  const entry = buildLogEntry(level, message, context);
  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
    return;
  }

  console.log(output);
}

function info(message, context) {
  writeLog('info', message, context);
}

function debug(message, context) {
  writeLog('debug', message, context);
}

function error(message, context) {
  writeLog('error', message, context);
}

module.exports = {
  createRequestId,
  debug,
  info,
  error,
};
