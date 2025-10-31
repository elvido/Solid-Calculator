import express from 'express';
import morgan from 'morgan';
import log from './logger.mjs';
import statusRoute from './routes/status.mjs';
import configRoute from './routes/config.mjs';

const app = express();
const PORT = 3001;

// Add Morgan middleware
// 'dev' is a concise, color-coded format good for development
// Redirect Morgan logs to your logger
app.use(
  morgan('dev', {
    stream: {
      write: (msg) => log.verbose(msg.trim()),
    },
  })
);

app.use(express.json());

app.use('/api/status', statusRoute);
app.use('/api/config', configRoute);

app.listen(PORT, () => log.verbose(`Mock server running at http://localhost:${PORT}`));
