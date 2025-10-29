import express from 'express';
import itemRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middlewares/errorHandler';
import cors from 'cors';
import config from './config/config';

const app = express();

app.use(express.json());
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// Routes
app.use('/users', itemRoutes);
app.use('/auth', authRoutes);

app.use(errorHandler);

export default app;
