import { randomUUID } from 'node:crypto';
import log from './express-serve-logger.mjs';

/**
 * Adds a stable request ID to every request and exposes a context-aware logger
 * as req.log for downstream middleware and route handlers.
 */
export function requestContext() {
  return (req, res, next) => {
    const incomingId = req.get('x-request-id')?.trim();
    const requestId = incomingId ? incomingId.slice(0, 128) : randomUUID();

    req.requestId = requestId;
    req.log = log.withContext({ requestId });
    res.setHeader('x-request-id', requestId);
    next();
  };
}
