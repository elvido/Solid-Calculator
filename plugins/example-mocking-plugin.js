// mock-api.js
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

    router.use((req, res, next) => {
        console.warn(`[mock] Missed route: ${req.method} ${req.originalUrl}`);
        next();
    });

    return router;
}