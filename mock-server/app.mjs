import express from 'express';
import morgan from 'morgan';
import log from './logger.mjs';
import statusRoute from './routes/status.mjs';
import configRoute from './routes/config.mjs';
import { requestContext } from '../plugins/request-context.mjs';

/**
 * Creates the development mock API without binding a network port.
 * Keeping app creation separate makes the API easy to test and replace.
 */
export function createMockApp() {
  const app = express();

  app.use(requestContext());

  app.use(
    morgan(
      (tokens, req, res) =>
        [
          req.requestId,
          tokens.method(req, res),
          tokens.url(req, res),
          tokens.status(req, res),
          tokens['response-time'](req, res) + ' ms',
        ].join(' '),
      {
        stream: {
          write: (msg) => log.verbose(msg.trim()),
        },
      }
    )
  );

  app.use(express.json());
  app.use('/api/status', statusRoute);
  app.use('/api/config', configRoute);

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    (req.log ?? log).error('Unhandled mock API error', error);
    res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
  });

  return app;
}

const app = createMockApp();

export default app;
