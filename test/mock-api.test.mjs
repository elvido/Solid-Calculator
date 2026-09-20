import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createMockApp } from '../mock-server/api-app.mjs';

let server;
let baseUrl;

beforeEach(async () => {
  server = createMockApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test('mock API exposes status and request IDs', async () => {
  const response = await fetch(`${baseUrl}/api/status`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.system, 'online');
  assert.match(response.headers.get('x-request-id'), /^[0-9A-HJKMNP-TV-Z]{10}-[0-9A-HJKMNP-TV-Z]{16}$/);
});

test('mock API preserves a supplied request ID', async () => {
  const response = await fetch(`${baseUrl}/api/config`, {
    headers: { 'x-request-id': 'learning-example-123' },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'learning-example-123');
});

test('mock API gives each app instance fresh configuration state', async () => {
  const updateResponse = await fetch(`${baseUrl}/api/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: 'dark' }),
  });
  const updateBody = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updateBody.config.theme, 'dark');

  const freshApp = createMockApp().listen(0, '127.0.0.1');
  await once(freshApp, 'listening');

  try {
    const freshBaseUrl = `http://127.0.0.1:${freshApp.address().port}`;
    const response = await fetch(`${freshBaseUrl}/api/config`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.theme, 'light');
  } finally {
    await new Promise((resolve, reject) => freshApp.close((error) => (error ? reject(error) : resolve())));
  }
});

test('mock API only exposes allowlisted environment metadata and keeps cwd', async () => {
  const previousApiKey = process.env.API_KEY;
  const previousCi = process.env.CI;
  const previousLang = process.env.LANG;
  const previousTerm = process.env.TERM;
  process.env.API_KEY = 'must-not-be-returned';
  process.env.CI = 'true';
  process.env.LANG = 'en_US.UTF-8';
  process.env.TERM = 'xterm-256color';

  try {
    const response = await fetch(`${baseUrl}/api/status`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.environment.API_KEY, undefined);
    assert.equal(body.environment.CI, 'true');
    assert.equal(body.environment.LANG, 'en_US.UTF-8');
    assert.equal(body.environment.TERM, 'xterm-256color');
    assert.equal(body.cwd, process.cwd());
  } finally {
    if (previousApiKey === undefined) delete process.env.API_KEY;
    else process.env.API_KEY = previousApiKey;
    if (previousCi === undefined) delete process.env.CI;
    else process.env.CI = previousCi;
    if (previousLang === undefined) delete process.env.LANG;
    else process.env.LANG = previousLang;
    if (previousTerm === undefined) delete process.env.TERM;
    else process.env.TERM = previousTerm;
  }
});
