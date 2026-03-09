import express from 'express';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middlewares/errorHandler';
import cors from 'cors';
import config from './config/config';

const app = express();

app.use(express.json());
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// Health check — used by Fly.io load balancer
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

export default app;
