// express-serve.config.mjs
import 'dotenv/config';
import { devtoolsPlugin } from './plugins/express-serve-devtools.mjs';
import { exampleMocking } from './plugins/example-mocking-plugin.mjs';

const frontendPort = Number(process.env.FRONTEND_PORT ?? 3000);
const frontendHost = process.env.FRONTEND_HOST ?? '127.0.0.1';
const mockApiUrl = process.env.MOCK_API_URL ?? `http://127.0.0.1:${process.env.MOCK_PORT ?? 3001}`;

/** @type {import('./plugins/express-serve-options').ExpressServeOptions} */
export default {
  openPage: process.env.OPEN_PAGE !== 'false',
  contentBase: ['dist', 'src'],
  host: frontendHost,
  port: frontendPort,
  historyAPIFallback: { path: 'dist', routes: ['/about'] },
  verbose: true,
  traceRequests: true,
  proxy: {
    '/api': mockApiUrl,
    '/config': {
      target: mockApiUrl,
      rewrite: '/api/config',
    },
  },
  middleware: [devtoolsPlugin({ projectRoot: './src', workspaceData: './dist', verbose: true }), exampleMocking()],
};
