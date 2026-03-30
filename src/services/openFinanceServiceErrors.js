function buildError(message, status = 400, details = null) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

module.exports = {
  buildError,
};
