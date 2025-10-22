/**
 * Configuration options for the Express server and Rollup plugin.
 *
 * @typedef {object} ExpressServeOptions
 * @property {string | string[]} [contentBase] - Static file directories to serve
 * @property {number} [port=10001] - Port to listen on
 * @property {string} [host='localhost'] - Hostname to bind
 * @property {boolean} [open=false] - Open browser after server starts
 * @property {string} [openPage='/'] - Page to open (relative or full URL)
 * @property {Record<string, string | { target: string, stripPrefix?: boolean }>} [proxy] - Proxy route mappings
 * @property {boolean | string} [historyApiFallback] - SPA fallback (true or custom file path)
 * @property {Record<string, string>} [headers] - Custom response headers
 * @property {boolean} [verbose=true] - Log server and proxy activity
 * @property {(server: import('http').Server | import('https').Server) => void} [onListening] - Callback when server starts
 * @property {{ key: string, cert: string }} [https] - HTTPS key and cert file paths
 * @property {Array<import('express').RequestHandler>} [middleware] - Additional Express middleware
 * @property {string | { format?: string | ((tokens, req, res) => string), filter?: string | string[] }} [traceRequests] - Morgan logging config
 * @property {Record<string, string | string[]>} [mimeTypes] - Custom MIME type overrides
 */
