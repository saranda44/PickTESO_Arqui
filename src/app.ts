import express from 'express';
import routes from './routes/routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

// ---- Body parsing ----
app.use(express.json());

// ---- Health check ----
app.get('/health', (_req, res) => {
  res.json({ service: 'notifications', status: 'ok' });
});

// ---- Routes ----
app.use('/notifications', routes);
app.use(errorMiddleware);

export default app;