import 'dotenv/config';
import log from './logger.mjs';
import app from './api-app.mjs';

const configuredPort = Number(process.env.MOCK_PORT ?? 3001);
if (!Number.isInteger(configuredPort) || configuredPort < 0 || configuredPort > 65535) {
  throw new RangeError(`Invalid MOCK_PORT: ${process.env.MOCK_PORT}`);
}

const PORT = configuredPort;
const HOST = process.env.MOCK_HOST ?? '127.0.0.1';
const server = app.listen(PORT, HOST, () => log.verbose(`Mock server running at http://${HOST}:${PORT}`));

for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
  process.once(signal, () => {
    log.info(`Shutting down mock server after ${signal}`);
    server.close((error) => {
      if (error) {
        log.error('Failed to shut down mock server', error);
        process.exitCode = 1;
      }
    });
  });
}
