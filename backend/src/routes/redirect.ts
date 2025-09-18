import { Router, type Request, type Response } from 'express';
import { getShortUrlByShortcode, recordClick } from '../services/database';
import { logger } from '../middleware/logger';

const router = Router();

const isValidShortcode = (shortcode: string): boolean => {
  const regex = /^[a-zA-Z0-9]{3,20}$/;
  return regex.test(shortcode);
};

router.get('/:shortcode', async (req: Request, res: Response) => {
  try {
    const { shortcode } = req.params;

    if (!shortcode || !isValidShortcode(shortcode)) {
      logger.warn('Invalid shortcode in redirect request', { shortcode });
      return res.status(400).json({
        error: 'Invalid shortcode format',
        message: 'Shortcode must be 3-20 alphanumeric characters'
      });
    }

    const shortUrl = await getShortUrlByShortcode(shortcode);
    if (!shortUrl) {
      logger.warn('Shortcode not found for redirect', { shortcode });
      return res.status(404).json({
        error: 'Shortcode not found',
        message: 'The requested shortcode does not exist or has expired'
      });
    }

    // Record click
    const clickData = {
      referrer: req.get('Referer'),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      location: 'Unknown' // for now, in production, we can use geo locaion service
    };

    // Record click in database
    await recordClick(shortcode, clickData);
    
    logger.info('Redirect successful', {
      shortcode,
      originalUrl: shortUrl.originalUrl,
      referrer: clickData.referrer,
      ip: clickData.ip
    });
    // Redirect to original URL
    res.redirect(302, shortUrl.originalUrl);
  } catch (error: any) {
    logger.error('Error during redirect', error, { shortcode: req.params.shortcode });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process redirect'
    });
  }
});

export default router;
