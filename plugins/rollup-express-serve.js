import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import opener from 'opener';

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
 *   middleware?: Array<import('express').RequestHandler>
 * }} options
 * @returns {import('rollup').Plugin}
 */
export default function expressServe(options = {}) {
  let started = false;

  return {
    name: 'express-serve',
    buildStart() {
      if (started) return;
      started = true;

      const app = express();
      const port = options.port || 10001;
      const host = options.host || 'localhost';
      const contentBase = Array.isArray(options.contentBase)
        ? options.contentBase
        : [options.contentBase || ''];

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
        app.use(express.static(path.resolve(base)));
      });

      // Proxy routes
      if (options.proxy) {
        Object.entries(options.proxy).forEach(([route, target]) => {
          app.use(route, createProxyMiddleware({ target, changeOrigin: true }));
        });
      }

      // SPA fallback
      if (options.historyApiFallback) {
        const fallbackPath =
          typeof options.historyApiFallback === 'string'
            ? options.historyApiFallback
            : '/index.html';

        app.use((req, res, next) => {
          if (req.method === 'GET' && !req.path.startsWith('/api')) {
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

        if (options.open) opener(url);
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