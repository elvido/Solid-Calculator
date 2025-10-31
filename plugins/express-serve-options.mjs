import * as fs from 'fs';
import * as path from 'path';

/**
 * @typedef {import('./express-serve-options').ExpressServeOptions} ExpressServeOptions
 */

/**
 * @typedef {Object} ExpressServeOptions
 * @property {string|string[]} [contentBase=''] - Directory or directories to serve static files from.
 * @property {string|string[]|Record<string,string>} [contentBase=''] - serving static files: folder -> "/", folder[] → "/", <folder, mount> -> explicit mapping
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
  const content = normalizeContentBase(raw.contentBase);
  return {
    contentBase: content,
    port: raw.port ?? 10001,
    host: raw.host ?? 'localhost',
    openPage: normalizeOpenPage(raw.openPage),
    proxy: normalizeProxy(raw.proxy),
    historyAPIFallback: normalizeHistoryFallback(raw.historyAPIFallback, content),
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
  if (typeof contentBase === 'string') return { [contentBase]: '/' };
  if (Array.isArray(contentBase) && contentBase.every((c) => typeof c === 'string')) {
    return contentBase.reduce((acc, base) => {
      acc[base] = '/';
      return acc;
    }, {});
  }
  if (typeof contentBase === 'object' && !Array.isArray(contentBase)) {
    return Object.fromEntries(
      Object.entries(contentBase).map(([base, mount]) => {
        // Default to "/" if falsy, and ensure leading slash
        let normalized = mount || '/';
        if (!normalized.startsWith('/')) normalized = '/' + normalized;
        return [base, normalized];
      })
    );
  }
  return {};
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

function normalizeHistoryFallback(fallback, content) {
  const defaultPath = 'index.html';
  let fallbackRoutes;
  if (fallback === true) {
    fallbackRoutes = { path: defaultPath, routes: [] };
  } else if (typeof fallback === 'string') {
    fallbackRoutes = { path: fallback, routes: [] };
  } else if (Array.isArray(fallback)) {
    fallbackRoutes = { path: defaultPath, routes: fallback };
  } else if (fallback && typeof fallback === 'object') {
    fallbackRoutes = {
      path: typeof fallback.path === 'string' ? fallback.path : defaultPath,
      routes: Array.isArray(fallback.routes) ? fallback.routes : [],
    };
  }
  if (fallbackRoutes) {
    if (fallbackRoutes.path === defaultPath) {
      // Try to find index.html in root-mounted contentBase dirs
      for (const [base, mount] of Object.entries(content)) {
        if (mount === '/') {
          const filePath = path.resolve(base, defaultPath);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            fallbackRoutes.path = filePath;
            break;
          }
        }
      }
    } else {
      // If the fallback path is a directory, append index.html
      let filePath = path.resolve(fallbackRoutes.path);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, defaultPath);
      }
      fallbackRoutes.path = path.resolve(filePath);
    }
  }
  return fallbackRoutes;
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
