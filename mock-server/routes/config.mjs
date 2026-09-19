import { Router } from 'express';

/**
 * Creates isolated state for one mock API application instance.
 *
 * Keeping state outside the router module prevents tests from sharing data
 * accidentally and makes it straightforward to replace this object with a
 * persistence adapter later.
 */
export function createConfigState(initialState = {}) {
  return {
    theme: 'light',
    ...initialState,
  };
}

/**
 * Creates the configuration routes for a specific state object.
 * @param {ReturnType<typeof createConfigState>} config
 */
export default function createConfigRoute(config = createConfigState()) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(config);
  });

  router.post('/', (req, res) => {
    const updates = req.body;

    if ('theme' in updates && !['light', 'dark'].includes(updates.theme)) {
      return res.status(400).json({ error: 'Invalid theme value' });
    }

    Object.assign(config, updates);
    res.status(200).json({ message: 'Config updated', config });
  });

  return router;
}
