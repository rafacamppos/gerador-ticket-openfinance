const { openFinanceApiBaseUrl } = require('../config/env');
const logger = require('../utils/logger');

function getServiceDeskBaseUrl(context = {}) {
  return String(context.environmentBaseUrl || openFinanceApiBaseUrl || '').replace(/\/+$/, '');
}

function getEnvironmentInfo(context = {}) {
  const baseUrl = getServiceDeskBaseUrl(context);
  if (baseUrl.includes('servicedesk.openfinancebrasil.org.br')) {
    return { env: 'PRODUCTION', baseUrl };
  }
  if (baseUrl.includes('sandbox') || baseUrl.includes('homolog') || baseUrl.includes('staging')) {
    return { env: 'SANDBOX/STAGING', baseUrl };
  }
  return { env: 'UNKNOWN', baseUrl };
}

function getApiBaseUrl(context = {}) {
  return `${getServiceDeskBaseUrl(context)}/api/v1`;
}

function buildError(message, status = 500, details = null) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function getResponseHeaderValues(response, headerName) {
  if (!response || !response.headers) {
    return [];
  }

  if (typeof response.headers.getSetCookie === 'function' && headerName.toLowerCase() === 'set-cookie') {
    return response.headers.getSetCookie().filter(Boolean);
  }

  const headerValue = response.headers.get(headerName);
  return headerValue ? [headerValue] : [];
}

function createUrl(path, query, context) {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const url = new URL(normalizedPath, `${getApiBaseUrl(context)}/`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

function createForwardHeaders(extraHeaders = {}) {
  const headers = {};

  if (extraHeaders.authorization) {
    headers.authorization = extraHeaders.authorization;
  }

  if (extraHeaders.cookie) {
    headers.cookie = extraHeaders.cookie;
  }

  if (extraHeaders.cache) {
    headers.cache = extraHeaders.cache;
  }

  return headers;
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw buildError('Open Finance upstream request failed.', response.status, payload);
  }

  return payload;
}

async function handleResponseWithMeta(response) {
  const payload = await handleResponse(response);

  return {
    payload,
    headers: {
      setCookie: getResponseHeaderValues(response, 'set-cookie'),
      cookie: getResponseHeaderValues(response, 'cookie'),
      cache: response.headers.get('cache') || response.headers.get('x-cache') || null,
    },
  };
}

async function getJson(path, query, headers, context) {
  const url = createUrl(path, query, context);
  const envInfo = getEnvironmentInfo(context);
  const startTime = Date.now();

  logger.debug('Open Finance API Request', {
    method: 'GET',
    endpoint: url.toString(),
    environment: envInfo.env,
    baseUrl: envInfo.baseUrl,
    path,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: createForwardHeaders(headers),
  });

  const duration = Date.now() - startTime;
  logger.debug('Open Finance API Response', {
    method: 'GET',
    endpoint: url.toString(),
    environment: envInfo.env,
    statusCode: response.status,
    durationMs: duration,
  });

  return handleResponse(response);
}

async function postJson(path, body, query, headers, context) {
  const url = createUrl(path, query, context);
  const envInfo = getEnvironmentInfo(context);
  const startTime = Date.now();

  logger.debug('Open Finance API Request', {
    method: 'POST',
    endpoint: url.toString(),
    environment: envInfo.env,
    baseUrl: envInfo.baseUrl,
    path,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...createForwardHeaders(headers),
    },
    body: JSON.stringify(body),
  });

  const duration = Date.now() - startTime;
  logger.debug('Open Finance API Response', {
    method: 'POST',
    endpoint: url.toString(),
    environment: envInfo.env,
    statusCode: response.status,
    durationMs: duration,
  });

  return handleResponse(response);
}

async function postJsonWithMeta(path, body, query, headers, context) {
  const url = createUrl(path, query, context);
  const envInfo = getEnvironmentInfo(context);
  const startTime = Date.now();

  logger.debug('Open Finance API Request', {
    method: 'POST',
    endpoint: url.toString(),
    environment: envInfo.env,
    baseUrl: envInfo.baseUrl,
    path,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...createForwardHeaders(headers),
    },
    body: JSON.stringify(body),
  });

  const duration = Date.now() - startTime;
  logger.debug('Open Finance API Response', {
    method: 'POST',
    endpoint: url.toString(),
    environment: envInfo.env,
    statusCode: response.status,
    durationMs: duration,
  });

  return handleResponseWithMeta(response);
}

async function putJson(path, body, headers, context) {
  const url = createUrl(path, undefined, context);
  const envInfo = getEnvironmentInfo(context);
  const startTime = Date.now();

  logger.debug('Open Finance API Request', {
    method: 'PUT',
    endpoint: url.toString(),
    environment: envInfo.env,
    baseUrl: envInfo.baseUrl,
    path,
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...createForwardHeaders(headers),
    },
    body: JSON.stringify(body),
  });

  const duration = Date.now() - startTime;
  logger.debug('Open Finance API Response', {
    method: 'PUT',
    endpoint: url.toString(),
    environment: envInfo.env,
    statusCode: response.status,
    durationMs: duration,
  });

  return handleResponse(response);
}

async function postMultipart(path, file, headers, context) {
  const url = createUrl(path, undefined, context);
  const envInfo = getEnvironmentInfo(context);
  const startTime = Date.now();

  logger.debug('Open Finance API Request', {
    method: 'POST',
    endpoint: url.toString(),
    environment: envInfo.env,
    baseUrl: envInfo.baseUrl,
    path,
    contentType: 'multipart/form-data',
    fileName: file.originalname || 'attachment',
  });

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }),
    file.originalname || 'attachment'
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: createForwardHeaders(headers),
    body: formData,
  });

  const duration = Date.now() - startTime;
  logger.debug('Open Finance API Response', {
    method: 'POST',
    endpoint: url.toString(),
    environment: envInfo.env,
    statusCode: response.status,
    durationMs: duration,
  });

  return handleResponse(response);
}

async function downloadBinary(url, headers = {}) {
  const startTime = Date.now();
  const envInfo = url.includes('servicedesk.openfinancebrasil.org.br')
    ? { env: 'PRODUCTION', baseUrl: 'https://servicedesk.openfinancebrasil.org.br' }
    : { env: 'UNKNOWN', baseUrl: 'unknown' };

  logger.debug('Open Finance Binary Download Request', {
    method: 'GET',
    url,
    environment: envInfo.env,
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: createForwardHeaders(headers),
  });

  const duration = Date.now() - startTime;

  if (response.url && /\/Login\.jsp/i.test(response.url)) {
    logger.debug('Open Finance Binary Download Response', {
      method: 'GET',
      url,
      environment: envInfo.env,
      statusCode: response.status,
      redirectedToLogin: true,
      durationMs: duration,
    });
    throw buildError('Open Finance upstream request failed.', 401, {
      redirectedToLogin: true,
      url: response.url,
    });
  }

  if (!response.ok) {
    logger.debug('Open Finance Binary Download Response', {
      method: 'GET',
      url,
      environment: envInfo.env,
      statusCode: response.status,
      durationMs: duration,
    });
    const payload = await response.text();
    throw buildError('Open Finance upstream request failed.', response.status, payload);
  }

  logger.debug('Open Finance Binary Download Response', {
    method: 'GET',
    url,
    environment: envInfo.env,
    statusCode: response.status,
    durationMs: duration,
  });

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    headers: {
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      contentDisposition: response.headers.get('content-disposition') || null,
      contentLength: response.headers.get('content-length') || null,
    },
  };
}

module.exports = {
  createUrl,
  downloadBinary,
  getJson,
  getApiBaseUrl,
  getServiceDeskBaseUrl,
  getEnvironmentInfo,
  postJson,
  postJsonWithMeta,
  putJson,
  postMultipart,
};
