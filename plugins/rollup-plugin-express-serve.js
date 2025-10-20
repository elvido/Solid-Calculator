import express from 'express';
import path from 'path';
import fs from 'fs';
import { lookup as defaultLookup } from 'mime-types';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import open from 'open';
import morgan from 'morgan';

let server

/**
 * @param {{
 *   contentBase?: string | string[], // Static file directories to serve
 *   port?: number,                   // Port to listen on (default: 10001)
 *   host?: string,                   // Hostname to bind (default: 'localhost')
 *   open?: boolean,                  // Open browser after server starts
 *   openPage?: string,               // Page to open (relative or full URL)
 *   proxy?: Record<string, string | { target: string, stripPrefix?: boolean }>, // Proxy route mappings
 *   historyApiFallback?: boolean | string, // SPA fallback (true or custom file path)
 *   headers?: Record<string, string>,      // Custom response headers
 *   verbose?: boolean,                     // Log server and proxy activity
 *   onListening?: (server: import('http').Server | import('https').Server) => void, // Callback when server starts
 *   https?: { key: string, cert: string }, // HTTPS key and cert file paths
 *   middleware?: Array<import('express').RequestHandler>, // Additional Express middleware
 *   traceRequests?: string | { format?: string | ((tokens, req, res) => string), filter?: string | string[] }, // Morgan logging config
 *   mimeTypes?: Record<string, string | string[]> // Custom MIME type overrides
 * }} options
 * @returns {import('rollup').Plugin} Rollup plugin instance
 */
function expressServe(options = {}) {
  const app = express();
  const port = options.port || 10001;
  const host = options.host || 'localhost';
  const contentBase = Array.isArray(options.contentBase)
    ? options.contentBase
    : [options.contentBase || ''];

  const customMimeTypes = options.mimeTypes || {};

  function resolveMime(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const custom = customMimeTypes[ext];
    return typeof custom === 'string'
      ? custom
      : Array.isArray(custom)
        ? custom[0]
        : defaultLookup(filePath) || 'application/octet-stream';
  }

  // Morgan trace logging
  if (options.traceRequests) {
    let format;
    let skip;

    const defaultFormat = (tokens, req, res) => {
      const source = res.getHeader('x-trace-source') || 'unknown';
      const target = res.getHeader('x-trace-target') || '';
      const method = tokens.method(req, res);
      const url = tokens.url(req, res);
      const status = tokens.status(req, res);
      const time = tokens['response-time'](req, res);
      return `[TRACE] ${method} ${url} → ${status} (${source}) +${time}ms${target ? ` → ${target}` : ''}`;
    };

    if (typeof options.traceRequests === 'string') {
      format = options.traceRequests;
    } else if (typeof options.traceRequests === 'object') {
      format = options.traceRequests.format || defaultFormat;

      const filters = Array.isArray(options.traceRequests.filter)
        ? options.traceRequests.filter
        : typeof options.traceRequests.filter === 'string'
          ? [options.traceRequests.filter]
          : null;

      if (filters) {
        skip = (req) => !filters.some(prefix => req.originalUrl.startsWith(prefix));
      }
    } else {
      format = defaultFormat;
    }

    app.use(morgan(format, { skip }));
  }

  // Apply headers
  if (options.headers) {
    app.use((req, res, next) => {
      Object.entries(options.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    });
  }

  // Apply custom middleware
  if (Array.isArray(options.middleware)) {
    options.middleware.forEach(fn => app.use(fn));
  }

  // Serve static files
  contentBase.forEach(base => {
    app.use(express.static(path.resolve(base), {
      setHeaders: (res, filePath) => {
        const mimetype = resolveMime(filePath);
        res.setHeader('Content-Type', mimetype);
        res.setHeader('x-trace-source', 'static');
      }
    }));
  });

  // Proxy routes with optional prefix stripping
  if (options.proxy) {
    Object.entries(options.proxy).forEach(([route, config]) => {
      const target = typeof config === 'string' ? config : config.target;
      const stripPrefix = typeof config === 'object' && config.stripPrefix === true;

      const router = express.Router();

      router.use((req, res, next) => {
        const originalPath = req.originalUrl;
        const rewrittenPath = stripPrefix
          ? originalPath.replace(new RegExp(`^${route}`), '') || '/'
          : originalPath;

        req.url = rewrittenPath; // override Express-trimmed path

        const fullTargetUrl = target.replace(/\/$/, '') + '/' + req.url.replace(/^\//, '');
        res.setHeader('x-trace-source', 'proxy');
        res.setHeader('x-trace-target', fullTargetUrl);

        next();
      });

      router.use(createProxyMiddleware({
        target,
        changeOrigin: true
        // no pathRewrite needed — we already rewrote req.url
      }));

      app.use(route, router);
    });
  }

  // SPA fallback
  if (options.historyApiFallback) {
    const fallbackPath =
      typeof options.historyApiFallback === 'string'
        ? options.historyApiFallback
        : '/index.html';

    app.use((req, res, next) => {
      if (req.method === 'GET') {
        res.setHeader('x-trace-source', 'spa-fallback');
        res.sendFile(path.resolve(contentBase[0], fallbackPath));
      } else {
        next();
      }
    });
  }

  // release previous server instance if rollup is reloading configuration in watch mode
  if (server) {
    server.close()
  } else {
    closeServerOnTermination()
  }

  // Create server
  server = options.https
    ? createHttpsServer({
      key: fs.readFileSync(options.https.key),
      cert: fs.readFileSync(options.https.cert)
    }, app)
    : createHttpServer(app);

  // Handle common server errors
  server.on('error', e => {
    if (e.code === 'EADDRINUSE') {
      console.error('Endpoint is in use, either stop the other server or use a different port.')
      process.exit()
    } else {
      throw e
    }
  });

  const protocol = options.https ? 'https' : 'http';
  const url = `${protocol}://${host}:${port}`;

  const onListening = typeof options.onListening === 'function'
    ? options.onListening
    : () => {};
  server.listen(port, host, () => onListening(server));

  function closeServerOnTermination() {
    const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP']
    terminationSignals.forEach(signal => {
      process.on(signal, () => {
        if (server) {
          server.close()
          process.exit()
        }
      })
    })
  }

  let noBundle = 0;

  return {
    name: 'rollup-express-serve',
    generateBundle() {
      if (noBundle === 0) { // execute only once on startup
        noBundle++
        if (options.verbose !== false) {
          contentBase.forEach(base => {
            console.log(`\x1b[32m${url}\x1b[0m -> ${path.resolve(base)}`);
          });
        }
        if (options.open) {
          let opening;
          if (typeof options.openPage === 'string' && /^https?:\/\/.+/.test(options.openPage)) {
            // Full external URL provided
            opening = options.openPage;
          } else {
            // Relative path or undefined → default to root
            const page = options.openPage || '/';
            opening = url + (page.startsWith('/') ? page : '/' + page);
          }
          open(opening);
        }
      } 
    }    
  }
}

export default expressServe