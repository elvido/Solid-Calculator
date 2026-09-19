import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteProxyPath } from '../plugins/proxy-utils.mjs';

test('preserves a proxied path when prefix stripping is disabled', () => {
  assert.equal(
    rewriteProxyPath('/api/status?full=true', '/api/status?full=true', {
      '/api': { target: 'http://localhost:3001' },
    }),
    '/api/status?full=true'
  );
});

test('strips only the matched route prefix', () => {
  assert.equal(
    rewriteProxyPath('/auth/login', '/auth/login', {
      '/auth': { target: 'http://localhost:4000', stripPrefix: true },
    }),
    '/login'
  );
});

test('uses the explicit rewrite path and preserves the query string', () => {
  assert.equal(
    rewriteProxyPath('/config?theme=dark', '/config?theme=dark', {
      '/config': { target: 'http://localhost:3001', rewrite: '/api/config' },
    }),
    '/api/config?theme=dark'
  );
});

test('prefers the most specific matching route', () => {
  assert.equal(
    rewriteProxyPath('/api/admin/users', '/api/admin/users', {
      '/api': { target: 'http://localhost:3001', stripPrefix: true },
      '/api/admin': { target: 'http://localhost:3002', rewrite: '/internal/users' },
    }),
    '/internal/users'
  );
});
