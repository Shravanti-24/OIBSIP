import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    success: true,
    message: 'API is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: DB_STATES[dbState] || 'unknown',
  });
});

export default router;
