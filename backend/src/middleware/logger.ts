import { type Request, type Response, type NextFunction } from 'express';
class Logger {
  info(message: string, meta?: any): void {
    console.log('[INFO]', message, meta || '');
  }
  warn(message: string, meta?: any): void {
    console.warn('[WARN]', message, meta || '');
  }
  error(message: string, error?: any, meta?: any): void {
    const detail = error?.stack || error?.message || error || '';
    console.error('[ERROR]', message, detail, meta || '');
  }
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', message, meta || '');
    }
  }
}

export const logger = new Logger();

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const errorLoggingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled error', error, {
    method: req.method,
    url: req.url
  });
  next(error);
};
