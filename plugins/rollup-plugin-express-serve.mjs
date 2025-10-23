// Core dependencies
import express from 'express';
import path from 'path';
import fs from 'fs';
import { lookup as defaultLookup } from 'mime-types';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import open from 'open';
import morgan from 'morgan';
import chalk from 'chalk';
import './expressServeOptions.mjs'; // For JSDoc
import { escapeLeadingUnderscores } from 'typescript';

let server; // Holds the active server instance for reuse or shutdown

/**
 * Creates and configures an Express server based on the provided options.
 * This function is used by both the Rollup plugin and standalone wrappers.
 *
 * @param {ExpressServeOptions} options - Configuration options
 * @returns {import('http').Server | import('https').Server} - The created server instance
 */
function createServer(options = {}) {
  const app = express();
  const port = options.port || 10001;
  const host = options.host || 'localhost';
  const contentBase = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase || ''];
  const customMimeTypes = options.mimeTypes || {};

  /**
   * Resolves MIME type for a given file path, using custom overrides if provided.
   */
  function resolveMime(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const custom = customMimeTypes[ext];
    return typeof custom === 'string'
      ? custom
      : Array.isArray(custom)
        ? custom[0]
        : defaultLookup(filePath) || 'application/octet-stream';
  }

  // Enable request logging via Morgan if configured
  if (options.traceRequests) {
    let format;
    let skip;

    // Register custom tokens once
    morgan.token('trace-source', (req, res) => res.getHeader('x-trace-source') || 'unknown');
    morgan.token('trace-target', (req, res) => res.getHeader('x-trace-target') || '');
    morgan.token('content-length', (req, res) => {
      const len = res.getHeader('content-length');
      return len != null ? len : '-';
    });

    const defaultFormat = (tokens, req, res) => {
      const method = tokens.method(req, res);
      const url = tokens.url(req, res);
      const status = tokens.status(req, res);
      const source = tokens['trace-source'](req, res);
      const target = tokens['trace-target'](req, res);
      const time = tokens['response-time'](req, res);
      const length = tokens['content-length'](req, res);
      const coloredStatus =
        status >= 500
          ? chalk.yellow.bold(status)
          : status >= 400
            ? chalk.red.bold(status)
            : status >= 300
              ? chalk.cyan.bold(status)
              : status >= 200
                ? chalk.green.bold(status)
                : chalk.bold(status);

      return `[TRACE] ${method} ${url} → ${coloredStatus} (${source})${target ? ` → ${target}` : ''} +${time}ms : ${length} bytes`;
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
        skip = (req) => !filters.some((prefix) => req.originalUrl.startsWith(prefix));
      }
    } else {
      format = defaultFormat;
    }

    app.use(morgan(format, { skip }));
  }

  // Apply custom response headers
  if (options.headers) {
    app.use((req, res, next) => {
      Object.entries(options.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    });
  }

  // Apply additional Express middleware
  if (Array.isArray(options.middleware)) {
    options.middleware.forEach((fn) => app.use(fn));
  }

  // Serve static files from configured directories
  contentBase.forEach((base) => {
    app.use(
      express.static(path.resolve(base), {
        setHeaders: (res, filePath) => {
          const mimetype = resolveMime(filePath);
          res.setHeader('Content-Type', mimetype);
          res.setHeader('x-trace-source', 'static');
        },
      })
    );
  });

  // Setup proxy routes
  if (options.proxy) {
    Object.entries(options.proxy).forEach(([route, config]) => {
      const target = typeof config === 'string' ? config : config.target;
      const stripPrefix = typeof config === 'object' && config.stripPrefix === true;

      const router = express.Router();

      router.use((req, res, next) => {
        const originalPath = req.originalUrl;
        const rewrittenPath = stripPrefix ? originalPath.replace(new RegExp(`^${route}`), '') || '/' : originalPath;
        req.url = rewrittenPath;

        const fullTargetUrl = target.replace(/\/$/, '') + '/' + req.url.replace(/^\//, '');
        res.setHeader('x-trace-source', 'proxy');
        res.setHeader('x-trace-target', fullTargetUrl);

        next();
      });

      router.use(
        createProxyMiddleware({
          target,
          changeOrigin: true,
        })
      );

      app.use(route, router);
    });
  }

  // SPA fallback for client-side routing
  if (options.historyAPIFallback) {
    const basePath = contentBase[0];
    let fallbackPath;

    // fallback request handler
    const fallbackRequestHandler = (req, res, next) => {
      if (req.method === 'GET') {
        res.setHeader('x-trace-source', 'spa-fallback');
        res.sendFile(fallbackPath);
      } else {
        next();
      }
    };

    if (typeof options.historyAPIFallback === 'object') {
      fallbackPath = path.resolve(
        basePath,
        typeof options.historyAPIFallback.path === 'string' ? options.historyAPIFallback.path : 'index.html'
      );
      const routes = Array.isArray(options.historyAPIFallback.routes)
        ? options.historyAPIFallback.routes
        : Array.isArray(options.historyAPIFallback)
          ? options.historyAPIFallback
          : [];
      routes.forEach((route) => {
        if (typeof route === 'string') app.get(route, fallbackRequestHandler);
      });
    } else {
      fallbackPath = path.resolve(
        basePath,
        typeof options.historyAPIFallback === 'string' ? options.historyAPIFallback : 'index.html'
      );
      app.use(fallbackRequestHandler);
    }
  }

  // Gracefully close previous server if Rollup restarts
  if (server) {
    server.close();
  } else {
    closeServerOnTermination();
  }

  // Create HTTP or HTTPS server
  server = options.https
    ? createHttpsServer(
        {
          key: fs.readFileSync(options.https.key),
          cert: fs.readFileSync(options.https.cert),
        },
        app
      )
    : createHttpServer(app);

  // Handle common server errors
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error('Endpoint is in use, either stop the other server or use a different port.');
      process.exit();
    } else {
      throw e;
    }
  });

  const onListening = typeof options.onListening === 'function' ? options.onListening : () => {};
  server.listen(port, host, () => onListening(server));

  /**
   * Ensures the server shuts down cleanly on termination signals.
   */
  function closeServerOnTermination() {
    const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
    terminationSignals.forEach((signal) => {
      process.on(signal, () => {
        if (server) {
          server.close();
          process.exit();
        }
      });
    });
  }

  return server;
}

/**
 * Creates a serving utility object with methods to start the server,
 * print resolved paths, and open the browser.
 *
 * @param {ExpressServeOptions} options - Configuration options
 * @returns {{ startServer: Function, printResolvePaths: Function, openPage: Function }}
 */
export function createServing(options = {}) {
  return {
    startServer: () => createServer(options),

    printResolvePaths: () => {
      const protocol = options.https ? 'https' : 'http';
      const url = `${protocol}://${options.host || 'localhost'}:${options.port || 10001}`;
      const bases = Array.isArray(options.contentBase) ? options.contentBase : [options.contentBase || ''];
      bases.forEach((base) => {
        console.log(`\x1b[32m${url}\x1b[0m -> ${path.resolve(base)}`);
      });
    },

    openPage: () => {
      const protocol = options.https ? 'https' : 'http';
      const url = `${protocol}://${options.host || 'localhost'}:${options.port || 10001}`;
      let opening;
      if (typeof options.openPage === 'string' && /^https?:\/\//.test(options.openPage)) {
        opening = options.openPage;
      } else {
        const page = options.openPage || '/';
        opening = url + (page.startsWith('/') ? page : '/' + page);
      }
      open(opening);
    },
  };
}

/**
 * Rollup plugin entry point. Starts the server and hooks into Rollup's lifecycle.
 *
 * @param {ExpressServeOptions} options - Configuration options
 * @returns {import('rollup').Plugin} - Rollup plugin object
 */
function expressServe(options = {}) {
  const serving = createServing(options);
  serving.startServer();

  let bundleCount = 0;

  return {
    name: 'rollup-express-serve',
    generateBundle() {
      if (bundleCount === 0) {
        bundleCount++;
        if (options.verbose !== false) {
          serving.printResolvePaths();
        }
        if (options.open) {
          serving.openPage();
        }
      } else {
        bundleCount++;
      }
    },
  };
}

export default expressServe;
