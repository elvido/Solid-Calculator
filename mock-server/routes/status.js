import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    system: 'online',
    timestamp: new Date().toISOString(),
  });
});

export default router;
