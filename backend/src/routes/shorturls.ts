import { Router, type Request, type Response } from 'express';
import { type CreateShortUrlRequest, type CreateShortUrlResponse, type ShortUrlStats } from '../models/UrlShortener';
import { createShortUrl, getShortUrlStats, getAllShortUrls } from '../services/database';
import { logger } from '../middleware/logger';

const router = Router();

const getBaseUrl = (req: Request): string => {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  return `${req.protocol}://${req.get('host')}`;
};
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidShortcode = (shortcode: string): boolean => {
  // Alphanumeric, 3-20 characters
  const regex = /^[a-zA-Z0-9]{3,20}$/;
  return regex.test(shortcode);
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, validity, shortcode }: CreateShortUrlRequest = req.body;

    if (!url) {
      logger.warn('Missing URL in request', { body: req.body });
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL to shorten'
      });
    }

    if (!isValidUrl(url)) {
      logger.warn('Invalid URL format', { url, body: req.body });
      return res.status(400).json({
        error: 'Invalid URL format',
        message: 'Please provide a valid URL'
      });
    }

    if (validity !== undefined && (typeof validity !== 'number' || validity <= 0)) {
      logger.warn('Invalid validity period', { validity, body: req.body });
      return res.status(400).json({
        error: 'Invalid validity period',
        message: 'Validity must be a positive integer representing minutes'
      });
    }

    if (shortcode && !isValidShortcode(shortcode)) {
      logger.warn('Invalid shortcode format', { shortcode, body: req.body });
      return res.status(400).json({
        error: 'Invalid shortcode format',
        message: 'Shortcode must be 3-20 alphanumeric characters'
      });
    }

    const baseUrl = getBaseUrl(req);
    const shortUrl = await createShortUrl({ 
      originalUrl: url, 
      validity: validity || 30, 
      shortcode, 
      baseUrl 
    });
    const finalShortcode = shortcode || shortUrl.shortcode;

    const response: CreateShortUrlResponse = {
      shortLink: shortUrl.shortLink,
      expiry: shortUrl.expiresAt.toISOString()
    };

    logger.info('Short URL created successfully', {
      shortcode: finalShortcode,
      originalUrl: url,
      expiry: shortUrl.expiresAt
    });

    res.status(201).json(response);
  } catch (error: any) {
    if (error.message === 'Shortcode already exists') {
      logger.warn('Shortcode collision', { shortcode: req.body.shortcode });
      return res.status(409).json({
        error: 'Shortcode already exists',
        message: 'Please choose a different shortcode'
      });
    }

    logger.error('Error creating short URL', error, { body: req.body });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create short URL'
    });
  }
});

router.get('/:shortcode', async (req: Request, res: Response) => {
  try {
    const { shortcode } = req.params;

    if (!shortcode || !isValidShortcode(shortcode)) {
      logger.warn('Invalid shortcode in statistics request', { shortcode });
      return res.status(400).json({
        error: 'Invalid shortcode format',
        message: 'Shortcode must be 3-20 alphanumeric characters'
      });
    }

    const dbStats = await getShortUrlStats(shortcode);
    if (!dbStats) {
      logger.warn('Shortcode not found for statistics', { shortcode });
      return res.status(404).json({
        error: 'Shortcode not found',
        message: 'The requested shortcode does not exist or has expired'
      });
    }
    const baseUrl = getBaseUrl(req);
    const stats: ShortUrlStats = {
      ...dbStats,
      shortLink: `${baseUrl}/${shortcode}`,
      createdAt: dbStats.createdAt.toISOString(),
      expiresAt: dbStats.expiresAt.toISOString(),
      clicks: dbStats.clicks.map((click: any) => ({
        ...click,
        timestamp: click.timestamp.toISOString()
      }))
    } as ShortUrlStats;

    logger.info('Statistics retrieved successfully', { shortcode, totalClicks: stats.totalClicks });
    res.json(stats);
  } catch (error: any) {
    logger.error('Error retrieving statistics', error, { shortcode: req.params.shortcode });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve statistics'
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const allUrls = await getAllShortUrls();
    const baseUrl = getBaseUrl(req);
    const urlsWithBaseUrl = allUrls.map((url: any) => ({
      ...url,
      shortLink: `${baseUrl}/${url.shortcode}`,
      createdAt: url.createdAt.toISOString(),
      expiresAt: url.expiresAt.toISOString(),
      clicks: url.clicks.map((click: any) => ({
        ...click,
        timestamp: click.timestamp.toISOString()
      }))
    }));
    
    logger.info('All short URLs retrieved', { count: urlsWithBaseUrl.length });
    res.json(urlsWithBaseUrl);
  } catch (error: any) {
    logger.error('Error retrieving all short URLs', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve short URLs'
    });
  }
});

export default router;
