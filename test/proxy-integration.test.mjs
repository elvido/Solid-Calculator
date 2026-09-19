import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServing } from '../plugins/rollup-plugin-express-serve.mjs';

test('frontend proxy rewrites /config and forwards request IDs', async () => {
  let backendRequest;
  const backend = createServer((request, response) => {
    backendRequest = request;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ theme: 'dark' }));
  });

  await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
  const backendPort = backend.address().port;

  let frontendServer;
  const frontend = createServing({
    host: '127.0.0.1',
    port: 0,
    contentBase: [],
    verbose: false,
    proxy: {
      '/config': {
        target: `http://127.0.0.1:${backendPort}`,
        rewrite: '/api/config',
      },
    },
    onListening: (server) => {
      frontendServer = server;
    },
  });

  await frontend.startServing();
  await new Promise((resolve) => {
    const check = () => (frontendServer ? resolve() : setImmediate(check));
    check();
  });

  try {
    const frontendPort = frontendServer.address().port;
    const response = await fetch(`http://127.0.0.1:${frontendPort}/config?source=test`, {
      headers: { 'x-request-id': 'proxy-integration-123' },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { theme: 'dark' });
    assert.equal(backendRequest.url, '/api/config?source=test');
    assert.equal(backendRequest.headers['x-request-id'], 'proxy-integration-123');
    assert.equal(response.headers.get('x-request-id'), 'proxy-integration-123');
  } finally {
    await frontend.stopServing();
    await new Promise((resolve, reject) => backend.close((error) => (error ? reject(error) : resolve())));
  }
});
