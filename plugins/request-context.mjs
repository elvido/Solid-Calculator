import { randomBytes } from 'node:crypto';
import log from './express-serve-logger.mjs';

const ulidAlphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeUlidTime(timestamp) {
  let encoded = '';

  for (let index = 9; index >= 0; index -= 1) {
    encoded = ulidAlphabet[timestamp % 32] + encoded;
    timestamp = Math.floor(timestamp / 32);
  }

  return encoded;
}

function encodeUlidRandomness(bytes) {
  let encoded = '';
  let buffer = 0;
  let bits = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      encoded += ulidAlphabet[(buffer >> bits) & 31];
      buffer &= (1 << bits) - 1;
    }
  }

  return encoded;
}

/**
 * Creates a time-sortable ULID for request correlation.
 *
 * The timestamp makes log entries easier to scan while the random component
 * keeps IDs unique across concurrent requests and server processes.
 */
export function createRequestId() {
  return `${encodeUlidTime(Date.now())}-${encodeUlidRandomness(randomBytes(10))}`;
}

/**
 * Adds a stable request ID to every request and exposes a context-aware logger
 * as req.log for downstream middleware and route handlers.
 */
export function requestContext() {
  return (req, res, next) => {
    const incomingId = req.get('x-request-id')?.trim();
    const requestId = incomingId ? incomingId.slice(0, 128) : createRequestId();

    req.requestId = requestId;
    req.log = log.withContext({ requestId });
    res.setHeader('x-request-id', requestId);
    next();
  };
}
