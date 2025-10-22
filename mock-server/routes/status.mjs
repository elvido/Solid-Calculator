import { Router } from 'express';
import os from 'os';
import process from 'process';

const router = Router();

router.get('/', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpus = os.cpus();

  // Filter and sort environment variables for clarity
  const envVars = Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => !key.toLowerCase().includes('password') && !key.toLowerCase().includes('secret'))
      .sort(([a], [b]) => a.localeCompare(b))
  );

  res.json({
    system: 'online',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: os.platform(),
    osType: os.type(),
    architecture: os.arch(),
    uptimeSeconds: os.uptime(),
    cpuModel: cpus[0]?.model,
    cpuCores: cpus.length,
    loadAverage: os.loadavg(), // [1min, 5min, 15min]
    memory: {
      totalMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMB: Math.round(os.freemem() / 1024 / 1024),
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    cwd: process.cwd(),
    environment: envVars,
  });
});

export default router;
