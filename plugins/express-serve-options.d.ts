import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { RequestHandler } from 'express';

/**
 * Configuration options for the Express server and Rollup plugin.
 */
export interface ExpressServeOptions {
  /**
   * Directory or directories to serve static files from.
   * @default ''
   * @example
   * contentBase: ['public', 'assets']
   */
  contentBase?: string | string[];

  /**
   * Port to listen on.
   * @default 10001
   */
  port?: number;

  /**
   * Hostname to bind the server to.
   * @default 'localhost'
   */
  host?: string;

  /**
   * Page to open in the browser after the server starts.
   * - `false` disables auto-open
   * - `true` opens the default page (`'/'`)
   * - a `string` opens that specific page (e.g., `'/index.html'` or a full URL)
   * @default false
   * @example
   * openPage: '/dashboard.html'
   */
  openPage?: boolean | string;

  /**
   * Proxy configuration: route to target mapping.
   * Supports optional prefix stripping.
   * @example
   * {
   *   '/api': 'http://localhost:3000',
   *   '/auth': { target: 'http://localhost:4000', stripPrefix: true }
   * }
   */
  proxy?: Record<string, string | { target: string; stripPrefix?: boolean }>;

  /**
   * Enables SPA fallback:
   * - `true` serves `index.html`
   * - a `string` serves that file
   * - a `string[]` defines fallback routes
   * - an object lets you set a custom `path` and optional `routes`
   * @default false
   * @example
   * // Simple usage
   * historyAPIFallback: true
   *
   * // Multiple routes
   * historyAPIFallback: ['/preferences', '/dashboard']
   */
  historyAPIFallback?: boolean | string | string[] | { path?: string; routes?: string[] };

  /**
   * Custom headers to apply to all responses.
   * @example
   * {
   *   'X-Custom-Header': 'MyValue',
   *   'Cache-Control': 'no-cache'
   * }
   */
  headers?: Record<string, string>;

  /**
   * Whether to log server and proxy activity.
   * @default true
   */
  verbose?: boolean;

  /**
   * Callback invoked once the server is listening.
   * @example
   * (server) => {
   *   const address = server.address();
   *  console.log(`Server is listening on http://${address.address}:${address.port}`);
   * }
   */
  onListening?: (server: HttpServer | HttpsServer) => void;

  /**
   * HTTPS configuration with paths to key and cert files.
   * @example
   * {
   *   key: '/path/to/key.pem',
   *   cert: '/path/to/cert.pem'
   * }
   */
  https?: { key: string; cert: string };

  /**
   * Additional Express middleware to apply.
   * @example
   * [
   *   (req, res, next) => {
   *     console.log(`Request URL: ${req.url}`);
   *     next();
   *   }
   * ]
   */
  middleware?: RequestHandler[];

  /**
   * Morgan logging format or configuration.
   * Supports custom format and route filtering supporting regex strings.
   * @default false
   *
   */
  traceRequests?:
    | boolean
    | string
    | {
        format?: string | ((tokens: any, req: any, res: any) => string);
        filter?: string | string[];
      };

  /**
   * Custom MIME type definitions to override or extend defaults.
   * Keys are file extensions, values are MIME types or arrays of MIME types.
   * @example
   * {
   *   '.wasm': 'application/wasm',             // Override default MIME type for .wasm files
   *   '.bar': ['text/bar', 'application/bar']  // Multiple MIME types for one extension
   * }
   */
  mimeTypes?: Record<string, string | string[]>;
}
