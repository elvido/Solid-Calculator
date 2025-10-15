import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import open from 'open';

/**
 * @param {{
 *   contentBase?: string | string[],
 *   port?: number,
 *   host?: string,
 *   open?: boolean,
 *   openPage?: string,
 *   proxy?: Record<string, string>,
 *   historyApiFallback?: boolean | string,
 *   headers?: Record<string, string>,
 *   verbose?: boolean,
 *   onListening?: (server: import('http').Server | import('https').Server) => void,
 *   https?: { key: string, cert: string },
 *   middleware?: Array<import('express').RequestHandler>,
 *   traceRequests?: boolean | string | string[]
 * }} options
 * @returns {import('rollup').Plugin}
 */
export default function expressServe(options = {}) {
  let started = false;

  return {
    name: 'rollup-express-serve',
    buildStart() {
      if (started) return;
      started = true;

      const app = express();
      const port = options.port || 10001;
      const host = options.host || 'localhost';
      const contentBase = Array.isArray(options.contentBase)
        ? options.contentBase
        : [options.contentBase || ''];

      // Trace filtering
      const traceFilters = Array.isArray(options.traceRequests)
        ? options.traceRequests
        : typeof options.traceRequests === 'string'
          ? [options.traceRequests]
          : null;

      // Request tracing middleware
      if (options.traceRequests) {
        app.use((req, res, next) => {
          const shouldTrace = !traceFilters || traceFilters.some(prefix => req.path.startsWith(prefix));
          if (!shouldTrace) return next();

          const start = Date.now();
          const originalEnd = res.end;

          res.end = function (...args) {
            const duration = Date.now() - start;
            const status = res.statusCode;
            const source = res.getHeader('x-trace-source') || 'unknown';
            console.log(`[TRACE] ${req.method} ${req.url} → ${status} (${source}) +${duration}ms`);
            originalEnd.apply(this, args);
          };

          next();
        });
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
          setHeaders: (res) => {
            res.setHeader('x-trace-source', 'static');
          }
        }));
      });

      // Proxy routes
      if (options.proxy) {
        Object.entries(options.proxy).forEach(([route, target]) => {
          app.use(route, createProxyMiddleware({
            target,
            changeOrigin: true,
            onProxyRes: (proxyRes) => {
              proxyRes.headers['x-trace-source'] = 'proxy';
            }
          }));
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

      // Create server
      const server = options.https
        ? createHttpsServer({
            key: fs.readFileSync(options.https.key),
            cert: fs.readFileSync(options.https.cert)
          }, app)
        : createHttpServer(app);

      server.listen(port, host, () => {
        const protocol = options.https ? 'https' : 'http';
        const url = `${protocol}://${host}:${port}${options.openPage || ''}`;

        if (options.verbose !== false) {
          contentBase.forEach(base => {
            console.log(`\x1b[32m${url}\x1b[0m -> ${path.resolve(base)}`);
          });
        }

        if (options.open) open(url);
        if (typeof options.onListening === 'function') {
          options.onListening(server);
        }
      });

      // Handle termination
      ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'].forEach(signal => {
        process.on(signal, () => {
          server.close(() => process.exit());
        });
      });
    }
  };
}