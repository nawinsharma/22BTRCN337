import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loggingMiddleware, errorLoggingMiddleware, logger } from './middleware/logger';
import { healthCheck, close } from './services/database';
import shorturlsRouter from './routes/shorturls';
import redirectRouter from './routes/redirect';

const app = express();
const PORT = process.env.PORT || 5000;
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(loggingMiddleware);

app.get('/health', async (req, res) => {
  logger.info('Health check requested');
  const dbHealth = await healthCheck();
  res.json({ 
    status: dbHealth ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'URL Shortener Service',
    database: dbHealth ? 'OK' : 'ERROR'
  });
});
app.use('/shorturls', shorturlsRouter);

app.use('/', redirectRouter);

app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, url: req.url });
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

app.use(errorLoggingMiddleware);

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled application error', error, {
    method: req.method,
    url: req.url
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

async function startServer() {
  try {
    const dbHealth = await healthCheck();
    if (!dbHealth) {
      logger.error('Database connection failed');
      process.exit(1);
    }
    
    logger.info('Database connection established');
    
    app.listen(PORT, () => {
      logger.info('URL Shortener Microservice started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await close();
  process.exit(0);
});

startServer();

export default app;
