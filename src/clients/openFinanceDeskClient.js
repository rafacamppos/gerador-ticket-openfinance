const { openFinanceApiBaseUrl } = require('../config/env');

function getServiceDeskBaseUrl(context = {}) {
  return String(context.environmentBaseUrl || openFinanceApiBaseUrl || '').replace(/\/+$/, '');
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
  const response = await fetch(createUrl(path, query, context), {
    method: 'GET',
    headers: createForwardHeaders(headers),
  });

  return handleResponse(response);
}

async function postJson(path, body, query, headers, context) {
  const response = await fetch(createUrl(path, query, context), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...createForwardHeaders(headers),
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

async function postJsonWithMeta(path, body, query, headers, context) {
  const response = await fetch(createUrl(path, query, context), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...createForwardHeaders(headers),
    },
    body: JSON.stringify(body),
  });

  return handleResponseWithMeta(response);
}

async function putJson(path, body, headers, context) {
  const response = await fetch(createUrl(path, undefined, context), {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...createForwardHeaders(headers),
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

async function postMultipart(path, file, headers, context) {
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }),
    file.originalname || 'attachment'
  );

  const response = await fetch(createUrl(path, undefined, context), {
    method: 'POST',
    headers: createForwardHeaders(headers),
    body: formData,
  });

  return handleResponse(response);
}

async function downloadBinary(url, headers = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: createForwardHeaders(headers),
  });

  if (response.url && /\/Login\.jsp/i.test(response.url)) {
    throw buildError('Open Finance upstream request failed.', 401, {
      redirectedToLogin: true,
      url: response.url,
    });
  }

  if (!response.ok) {
    const payload = await response.text();
    throw buildError('Open Finance upstream request failed.', response.status, payload);
  }

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
  postJson,
  postJsonWithMeta,
  putJson,
  postMultipart,
};
