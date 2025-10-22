// example-mocking-plugin.mjs
import express from 'express';

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

  // ✅ Audit log endpoint
  router.post('/log', express.text(), (req, res) => {
    const logEntry = req.body;
    const timestamp = new Date().toISOString();
    console.log(`\x1b[1m\x1b[35m[AUDIT ${timestamp}]\x1b[0m "${logEntry}"`);
    res.setHeader('x-trace-source', 'mock');
    res.status(200).json({ success: true });
  });

  return router;
}
