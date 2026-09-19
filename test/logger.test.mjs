import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import log from '../plugins/express-serve-logger.mjs';

afterEach(() => {
  log.register();
});

test('passes variadic arguments and merged context to a scoped logger', () => {
  const calls = [];
  const logger = {
    level: 'debug',
    error: (...args) => calls.push(['error', ...args]),
    warn: (...args) => calls.push(['warn', ...args]),
    verbose: (...args) => calls.push(['verbose', ...args]),
    info: (...args) => calls.push(['info', ...args]),
    debug: (...args) => calls.push(['debug', ...args]),
    log: (level, ...args) => calls.push([level, ...args]),
  };

  log.register(() => logger);
  log.withContext({ requestId: 'request-123', service: 'test' }).info('message', { service: 'override' }, 'tail');

  assert.deepEqual(calls, [['info', 'message', { requestId: 'request-123', service: 'override' }, 'tail']]);
});

test('supports scoped context chaining and generic log calls', () => {
  const calls = [];
  const logger = {
    level: 'debug',
    error: (...args) => calls.push(['error', ...args]),
    warn: (...args) => calls.push(['warn', ...args]),
    verbose: (...args) => calls.push(['verbose', ...args]),
    info: (...args) => calls.push(['info', ...args]),
    debug: (...args) => calls.push(['debug', ...args]),
    log: (level, ...args) => calls.push([level, ...args]),
  };

  log.register(() => logger);
  log.withContext({ requestId: 'request-123' }).withContext({ route: '/test' }).log('debug', 'message');

  assert.deepEqual(calls, [['debug', 'message', { requestId: 'request-123', route: '/test' }]]);
});
