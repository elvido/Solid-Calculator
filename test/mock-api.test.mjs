import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../mock-server/app.mjs';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test('mock API exposes status and request IDs', async () => {
  const response = await fetch(`${baseUrl}/api/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.system, 'online');
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
});

test('mock API preserves a supplied request ID', async () => {
  const response = await fetch(`${baseUrl}/api/config`, {
    headers: { 'x-request-id': 'learning-example-123' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'learning-example-123');
});
