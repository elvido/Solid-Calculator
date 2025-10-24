/**
 * @typedef {import('./express-serve-options').ExpressServeOptions} ExpressServeOptions
 */

/**
 * @typedef {Object} ExpressServeOptions
 * @property {string|string[]} [contentBase=''] - Directory or directories to serve static files from.
 * @property {number} [port=10001] - Port to listen on.
 * @property {string} [host='localhost'] - Hostname to bind the server to.
 * @property {boolean|string} [openPage=false] - Page to open in the browser after the server starts.
 * @property {Record<string, string | { target: string, stripPrefix?: boolean }>} [proxy] - Proxy configuration: route to target mapping.
 * @property {boolean|string|string[]|{ path?: string, routes?: string[] }} [historyAPIFallback=false] - SPA fallback configuration.
 * @property {Record<string, string>} [headers] - Custom headers to apply to all responses.
 * @property {boolean} [verbose=true] - Whether to log server and proxy activity.
 * @property {(server: import('http').Server | import('https').Server) => void} [onListening] - Callback invoked once the server is listening.
 * @property {{ key: string, cert: string }} [https] - HTTPS configuration with paths to key and cert files.
 * @property {import('express').RequestHandler[]} [middleware] - Additional Express middleware to apply.
 * @property {boolean|string|{ format?: string | ((tokens: any, req: any, res: any) => string), filter?: string|string[] }} [traceRequests=false] - Morgan logging format or configuration.
 * @property {Record<string, string|string[]>} [mimeTypes] - Custom MIME type definitions to override or extend defaults.
 */

/**
 * Normalize ExpressServeOptions with defaults and structure.
 * @param {Partial<ExpressServeOptions>} raw
 * @returns {ExpressServeOptions}
 */
export function normalizeExpressServeOptions(raw = {}) {
  return {
    contentBase: normalizeContentBase(raw.contentBase),
    port: raw.port ?? 10001,
    host: raw.host ?? 'localhost',
    openPage: normalizeOpenPage(raw.openPage),
    proxy: normalizeProxy(raw.proxy),
    historyAPIFallback: normalizeHistoryFallback(raw.historyAPIFallback),
    headers: raw.headers ?? {},
    verbose: raw.verbose ?? true,
    onListening: typeof raw.onListening === 'function' ? raw.onListening : () => {},
    https: raw.https ?? undefined,
    middleware: raw.middleware ?? [],
    traceRequests: normalizeTraceRequests(raw.traceRequests),
    mimeTypes: raw.mimeTypes ?? {},
  };
}

function normalizeContentBase(contentBase) {
  if (Array.isArray(contentBase)) return contentBase;
  if (typeof contentBase === 'string') return [contentBase];
  return [];
}

function normalizeOpenPage(openPage) {
  if (openPage === true) return '/';
  if (typeof openPage === 'string') return openPage;
  return undefined;
}

function normalizeProxy(proxy) {
  const result = {};
  for (const [route, value] of Object.entries(proxy || {})) {
    if (typeof value === 'string') {
      if (value.trim()) {
        result[route] = { target: value, stripPrefix: false };
      }
    } else if (value && typeof value.target === 'string' && value.target.trim()) {
      result[route] = {
        target: value.target,
        stripPrefix: value.stripPrefix ?? false,
      };
    }
  }
  return result;
}

function normalizeHistoryFallback(fallback) {
  const defaultPath = 'index.html';
  if (fallback === true) return { path: defaultPath, routes: [] };
  if (typeof fallback === 'string') return { path: fallback, routes: [] };
  if (Array.isArray(fallback)) return { path: defaultPath, routes: fallback };
  if (typeof fallback === 'object')
    return {
      path: typeof fallback.path === 'string' ? fallback.path : defaultPath,
      routes: Array.isArray(fallback.routes) ? fallback.routes : [],
    };
  return false;
}

function normalizeTraceRequests(trace) {
  if (trace === true) return { format: undefined, filter: [] };
  if (typeof trace === 'string' || typeof trace === 'function') return { format: trace, filter: [] };
  if (typeof trace == 'object')
    return {
      format: trace.format,
      filter: Array.isArray(trace.filter) ? trace.filter : [trace.filter],
    };
  return false;
}
