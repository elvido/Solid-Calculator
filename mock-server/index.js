import express from 'express';
import statusRoute from './routes/status.js';

const app = express();
const PORT = 3001;

app.use('/api/status', statusRoute);

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});