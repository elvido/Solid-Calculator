// example-mocking-plugin.mjs
import express from 'express';
import chalk from 'chalk';
import log from './express-serve-logger.mjs';

export function exampleMocking() {
  const router = express.Router();

  router.get('/xyz/check', (req, res) => {
    res.setHeader('x-trace-source', 'mock');
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  router.post('/xyz/login', express.json(), (req, res) => {
    const { username, password } = req.body;
    res.setHeader('x-trace-source', 'mock');
    if (username === 'admin' && password === 'secret') {
      res.json({ success: true, token: 'mock-token-123' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  });

  // Audit log endpoint
  router.post('/log', express.text(), (req, res) => {
    const logEntry = req.body;
    const timestamp = new Date().toISOString();
    log.info(`${chalk.bold.magenta(`<AUDIT ${timestamp}>`)} "${logEntry}"`);
    res.setHeader('x-trace-source', 'mock');
    res.status(200).json({ success: true });
  });

  return router;
}
