import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { once } from 'node:events';
import { createMockApp } from '../mock-server/api-app.mjs';
import { createServing } from '../plugins/rollup-plugin-express-serve.mjs';

let mockServer;
let previewServer;
let preview;
let baseUrl;

before(async () => {
  if (!existsSync('dist/index.html')) {
    throw new Error('Production output is missing. Run yarn build:prd before yarn test:preview.');
  }

  mockServer = createMockApp().listen(0, '127.0.0.1');
  await once(mockServer, 'listening');
  const mockUrl = `http://127.0.0.1:${mockServer.address().port}`;

  const previewReady = new Promise((resolve) => {
    preview = createServing({
      host: '127.0.0.1',
      port: 0,
      contentBase: ['dist', 'src'],
      openPage: false,
      verbose: false,
      traceRequests: false,
      historyAPIFallback: { path: 'dist', routes: ['/about'] },
      proxy: {
        '/api': mockUrl,
        '/config': {
          target: mockUrl,
          rewrite: '/api/config',
        },
      },
      onListening: (server) => resolve(server),
    });
  });

  await preview.startServing();
  previewServer = await previewReady;
  baseUrl = `http://127.0.0.1:${previewServer.address().port}`;
});

after(async () => {
  if (preview) await preview.stopServing();
  if (mockServer) {
    await new Promise((resolve, reject) => mockServer.close((error) => (error ? reject(error) : resolve())));
  }
});

test('production preview serves the application shell and SPA route', async () => {
  const rootResponse = await fetch(`${baseUrl}/`);
  const rootHtml = await rootResponse.text();
  const aboutResponse = await fetch(`${baseUrl}/about`);
  const aboutHtml = await aboutResponse.text();

  assert.equal(rootResponse.status, 200);
  assert.match(rootHtml, /<div id="root"><\/div>/);
  assert.equal(aboutResponse.status, 200);
  assert.match(aboutHtml, /<div id="root"><\/div>/);
});

test('production preview forwards API and rewritten config requests', async () => {
  const statusResponse = await fetch(`${baseUrl}/api/status`);
  const statusBody = await statusResponse.json();
  const configResponse = await fetch(`${baseUrl}/config`);
  const configBody = await configResponse.json();

  assert.equal(statusResponse.status, 200);
  assert.equal(statusBody.system, 'online');
  assert.match(statusResponse.headers.get('x-request-id'), /^[0-9A-HJKMNP-TV-Z]{10}-[0-9A-HJKMNP-TV-Z]{16}$/);
  assert.equal(configResponse.status, 200);
  assert.equal(configBody.theme, 'light');
});
