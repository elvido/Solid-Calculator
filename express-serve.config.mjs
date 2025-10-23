// express-serve.config.mjs
import { exampleMocking } from './plugins/example-mocking-plugin.mjs';

/** @type {import('./plugins/types.d.ts').expressServeOptions} */
export default {
  open: true,
  contentBase: 'dist',
  port: 3000,
  historyAPIFallback: ['/about'],
  verbose: true,
  traceRequests: true,
  proxy: {
    '/api': 'http://localhost:3001',
    '/config': {
      target: 'http://localhost:3001/api/config',
      stripPrefix: true,
    },
  },
  middleware: [exampleMocking()],
};
