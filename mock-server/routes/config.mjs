import { Router } from 'express';

const router = Router();

// In-memory mock config
const config = {
  theme: 'light',
  // You can add more settings here later
};

// GET full config
router.get('/', (req, res) => {
  res.json(config);
});

// POST to update config (partial updates allowed)
router.post('/', (req, res) => {
  const updates = req.body;

  // Optional: validate known keys
  if ('theme' in updates && !['light', 'dark'].includes(updates.theme)) {
    return res.status(400).json({ error: 'Invalid theme value' });
  }

  Object.assign(config, updates);
  res.status(200).json({ message: 'Config updated', config });
});

export default router;
