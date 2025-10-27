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
import { normalizeExpressServeOptions } from './express-serve-options.mjs';

let server; // Holds the active server instance for reuse or shutdown

/**
 * Close a running server instance.
 */
function closeServer() {
  if (!server) return Promise.resolve();

  return new Promise((resolve, reject) => {
    server.close((err) => {
      server = undefined;
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Creates and configures an Express server based on the provided options.
 * This function is used by both the Rollup plugin and standalone wrappers.
 *
 * @param {import('./express-serve-options').ExpressServeOptions} options - Configuration options
 * @returns {import('http').Server | import('https').Server} - The created server instance
 */
function createServer(options = {}) {
  const app = express();

  /**
   * Resolves MIME type for a given file path, using custom overrides if provided.
   */
  function resolveMime(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const custom = options.mimeTypes[ext];
    return typeof custom === 'string'
      ? custom
      : Array.isArray(custom)
        ? custom[0]
        : defaultLookup(filePath) || 'application/octet-stream';
  }

  // Enable request logging via Morgan if configured
  if (options.traceRequests) {
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

    const filter = options.traceRequests.filter;
    const format = options.traceRequests.format ? options.traceRequests.format : defaultFormat;
    let skip = () => false;

    if (Array.isArray(filter) && filter.length > 0) {
      const globToRegex = (pattern) =>
        new RegExp(
          '^' +
            pattern
              .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&') // escape special chars
              .replace(/\*/g, '.*') // * → .*
              .replace(/\?/g, '.') + // ? → .
            '$'
        );
      const regexFilter = filter.filter((f) => typeof f === 'string' && f.trim()).map((f) => globToRegex(f.trim()));

      skip = (req) => {
        const url = (req.originalUrl || req.url || '').split('?')[0];
        return !regexFilter.some((rx) => rx.test(url));
      };
    }

    app.use(morgan(format, { skip }));
  }

  // Apply custom response headers
  if (Object.keys(options.headers).length > 0) {
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
  options.contentBase.forEach((base) => {
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
      const target = config.target;
      const stripPrefix = config.stripPrefix !== false;

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
    const fallbackPath = path.resolve(options.contentBase[0], options.historyAPIFallback.path);

    // fallback request handler
    const fallbackRequestHandler = (req, res, next) => {
      if (req.method === 'GET') {
        res.setHeader('x-trace-source', 'spa-fallback');
        res.sendFile(fallbackPath);
      } else {
        next();
      }
    };

    if (Array.isArray(options.historyAPIFallback.routes) && options.historyAPIFallback.routes.length > 0) {
      options.historyAPIFallback.routes.forEach((route) => {
        if (typeof route === 'string') app.get(route, fallbackRequestHandler);
      });
    } else {
      app.use(fallbackRequestHandler);
    }
  }

  // Gracefully close previous server if Rollup restarts
  if (server) {
    closeServer();
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

  // Start listening
  server.listen(options.port, options.host, () => options.onListening(server));

  return server;
}

/**
 * Creates a serving utility object with methods to start the server,
 * print resolved paths, and open the browser.
 *
 * @param {import('./express-serve-options').ExpressServeOptions} options - Configuration options
 * @returns {{ startServing: Function, stopServing: Function, printResolvePaths: Function, openPage: Function }}
 */
export function createServing(options = {}) {
  // Normalize options
  options = normalizeExpressServeOptions(options);

  return {
    startServing: () => {
      createServer(options);
    },

    stopServing: async () => {
      await closeServer();
    },

    printPaths: () => {
      if (options.verbose !== false) {
        const protocol = options.https ? 'https' : 'http';
        const url = `${protocol}://${options.host}:${options.port}`;
        options.contentBase.forEach((base) => {
          console.log(`[VERBOSE] Serving: ${chalk.green(url)} -> ${path.resolve(base)}`);
        });
      }
    },

    openPage: () => {
      if (options.openPage) {
        const protocol = options.https ? 'https' : 'http';
        const url = `${protocol}://${options.host}:${options.port}`;
        const opening = /^https?:\/\//.test(options.openPage)
          ? options.openPage
          : url + (options.openPage.startsWith('/') ? options.openPage : '/' + options.openPage);
        if (options.verbose != false) console.log(`[VERBOSE] Opening browser at: ${opening}`);
        open(opening);
      }
    },
  };
}

/**
 * Rollup plugin entry point. Starts the server and hooks into Rollup's lifecycle.
 *
 * @param {import('./express-serve-options').ExpressServeOptions} options - Configuration options
 * @returns {import('rollup').Plugin} - Rollup plugin object
 */
function expressServe(options = {}) {
  const serving = createServing(options);

  /**
   * Ensures the server shuts down cleanly on termination signals.
   */
  const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
  terminationSignals.forEach((signal) => {
    process.on(signal, () => {
      serving.stopServing();
      process.exit();
    });
  });

  serving.startServing();

  let bundleCount = 0;

  return {
    name: 'rollup-express-serve',
    generateBundle() {
      if (bundleCount === 0) {
        bundleCount++;
        serving.printPaths();
        serving.openPage();
      } else {
        bundleCount++;
      }
    },
  };
}

export default expressServe;
