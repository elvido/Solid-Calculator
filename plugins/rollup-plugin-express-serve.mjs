import express from 'express';
import path from 'path';
import fs from 'fs';
import { lookup as defaultLookup } from 'mime-types';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import open from 'open';
import morgan from 'morgan';
import micromatch from 'micromatch';
import chalk from 'chalk';
import { normalizeExpressServeOptions } from './express-serve-options.mjs';
import log from './express-serve-logger.mjs';

/**
 * Close a running server instance.
 */
function closeServer(server) {
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

      return `Trace> ${method} ${url} → ${coloredStatus} (${source})${target ? ` → ${target}` : ''} +${time}ms : ${length} bytes`;
    };

    const filter = options.traceRequests.filter;
    const format = options.traceRequests.format ? options.traceRequests.format : defaultFormat;
    let skip = () => false;

    if (Array.isArray(filter) && filter.length > 0) {
      // Clean up filter patterns
      const patterns = filter.filter((f) => typeof f === 'string' && f.trim()).map((f) => f.trim());

      skip = (req) => {
        const url = (req.originalUrl || req.url || '').split('?')[0];
        // micromatch.isMatch returns true if url matches any pattern
        return !micromatch.isMatch(url, patterns);
      };
    }

    app.use(
      morgan(format, {
        skip,
        stream: {
          write: (msg) => log.verbose(msg.trim()),
        },
      })
    );
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
  Object.entries(options.contentBase).forEach(([base, mount]) => {
    app.use(
      mount,
      express.static(path.resolve(base), {
        setHeaders: (res, filePath) => {
          const mimetype = resolveMime(filePath);
          res.setHeader('Content-Type', mimetype);
          res.setHeader('x-trace-source', 'static');
          res.setHeader('x-trace-base', encodeURI(base));
        },
      })
    );
  });

  // Setup proxy routes
  if (options.proxy) {
    const proxyRoutes = Object.keys(options.proxy);
    const routerMap = Object.fromEntries(Object.entries(options.proxy).map(([route, cfg]) => [route, cfg.target]));

    app.use(
      createProxyMiddleware({
        changeOrigin: true,
        // Match only paths that start with a configured route
        pathFilter: proxyRoutes,
        router: routerMap,

        // Rewrite path if stripPrefix is enabled
        pathRewrite: (path, req) => {
          const match = proxyRoutes.find(([route]) => req.originalUrl.startsWith(route));
          if (true || match?.[1].stripPrefix === false) return '/api/config'; //path;
        },

        // Inject proxy headers
        on: {
          proxyReq: (proxyReq, req) => {
            proxyReq.setHeader('x-forwarded-for', req.ip);
            proxyReq.setHeader('x-forwarded-host', req.headers.host);
            proxyReq.setHeader('x-forwarded-proto', req.protocol);
            proxyReq.setHeader('forwarded', `for=${req.ip};proto=${req.protocol};host=${req.headers.host}`);
          },
          proxyRes: (proxyRes, req, res) => {
            const match = proxyRoutes.find(([route]) => req.originalUrl.startsWith(route));
            const rewrittenPath =
              match?.[1].stripPrefix === false
                ? req.originalUrl
                : req.originalUrl.replace(new RegExp(`^${match?.[0]}`), '') || '/';

            const fullTargetUrl = req.originalUrl; //match?.[1].target.replace(/\/$/, '') + '/' + rewrittenPath.replace(/^\//, '');
            res.setHeader('x-trace-source', 'proxy');
            res.setHeader('x-trace-target', fullTargetUrl);
          },
        },
      })
    );
  }

  // SPA fallback for client-side routing
  if (options.historyAPIFallback) {
    const fallbackPath = options.historyAPIFallback.path;

    // check if specified content file is accessible
    if (!(fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()))
      log.error(`Fallback content file is not accessible: "${fallbackPath}"`);

    // fallback request handler
    const fallbackRequestHandler = (req, res, next) => {
      if ((req.method === 'GET' || req.method === 'HEAD') && req.accepts('html')) {
        res.setHeader('x-trace-source', 'spa-fallback');
        res.setHeader('x-trace-base', encodeURI(fallbackPath));
        res.sendFile(fallbackPath);
      } else next();
    };

    if (Array.isArray(options.historyAPIFallback.routes) && options.historyAPIFallback.routes.length > 0) {
      options.historyAPIFallback.routes.forEach((route) => {
        if (typeof route === 'string') app.get(route, fallbackRequestHandler);
      });
    } else app.use(fallbackRequestHandler);
  }

  // Create HTTP or HTTPS server
  const server = options.https
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
      log.error('Endpoint is in use, either stop the other server or use a different port.');
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
 * Creates a serving controller with lifecycle hooks and utility methods.
 * Normalizes the provided options and returns an object to manage the server.
 *
 * @param {import('./express-serve-options').ExpressServeOptions} options - Configuration options
 * @returns {import('./express-serve-controller).ExpressServeController} - Serving controller
 */
export function createServing(_options = {}) {
  // Normalize options
  const options = normalizeExpressServeOptions(_options);

  let server = null;

  return {
    startServing: async () => {
      // Gracefully close previous server
      await closeServer(server);
      server = createServer(options);
    },

    stopServing: async () => {
      await closeServer(server);
    },

    printPaths: () => {
      if (options.verbose !== false) {
        const protocol = options.https ? 'https' : 'http';
        const baseUrl = `${protocol}://${options.host}:${options.port}`;
        Object.entries(options.contentBase).forEach(([base, mount]) => {
          log.verbose(`Serving: ${chalk.green(baseUrl + mount)} -> ${path.resolve(base)}`);
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
        if (options.verbose != false) log.verbose(`Opening browser at: ${opening}`);
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
