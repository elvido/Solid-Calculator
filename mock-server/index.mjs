import express from 'express';
import statusRoute from './routes/status.mjs';
import configRoute from './routes/config.mjs';

const app = express();
const PORT = 3001;

app.use(express.json());

app.use('/api/status', statusRoute);
app.use('/api/config', configRoute);

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
