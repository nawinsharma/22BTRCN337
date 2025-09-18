import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger';

// Create a single PrismaClient instance. Ensure DATABASE_URL is loaded.
export const prisma = new PrismaClient();

export const generateShortcode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const isShortcodeUnique = async (shortcode: string): Promise<boolean> => {
  try {
    const existing = await prisma.shortUrl.findUnique({
      where: { shortcode },
      select: { id: true }
    });
    return !existing;
  } catch (error) {
    logger.error('Error checking shortcode uniqueness', error, { shortcode });
    return false;
  }
};

export const createShortUrl = async (data: {
  originalUrl: string;
  shortcode?: string;
  validity: number;
  baseUrl: string;
}) => {
  try {
    let shortcode = data.shortcode;
    if (shortcode) {
      if (!(await isShortcodeUnique(shortcode))) {
        throw new Error('Shortcode already exists');
      }
    } else {
      do {
        shortcode = generateShortcode();
      } while (!(await isShortcodeUnique(shortcode)));
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + data.validity * 60 * 1000);

    const shortUrl = await prisma.shortUrl.create({
      data: {
        originalUrl: data.originalUrl,
        shortcode,
        expiresAt,
        validity: data.validity,
      },
      include: { clicks: true },
    });

    logger.info('Short URL created in database', {
      id: shortUrl.id,
      shortcode: shortUrl.shortcode,
      originalUrl: data.originalUrl,
    });

    return {
      ...shortUrl,
      shortLink: `${data.baseUrl}/${shortcode}`,
    };
  } catch (error) {
    logger.error('Error creating short URL', error, { originalUrl: data.originalUrl });
    throw error;
  }
};

export const getShortUrlByShortcode = async (shortcode: string) => {
  try {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortcode },
      include: { clicks: { orderBy: { timestamp: 'desc' } } },
    });
    if (!shortUrl || !shortUrl.isActive) return null;
    if (new Date() > shortUrl.expiresAt) {
      await prisma.shortUrl.update({ where: { id: shortUrl.id }, data: { isActive: false } });
      return null;
    }
    return shortUrl;
  } catch (error) {
    logger.error('Error getting short URL by shortcode', error, { shortcode });
    return null;
  }
};

export const getAllShortUrls = async () => {
  try {
    const shortUrls = await prisma.shortUrl.findMany({
      where: { isActive: true },
      include: { clicks: { orderBy: { timestamp: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const activeUrls = shortUrls.filter(url => url.expiresAt > now);
    const expiredIds = shortUrls.filter(url => url.expiresAt <= now).map(url => url.id);
    if (expiredIds.length > 0) {
      await prisma.shortUrl.updateMany({ where: { id: { in: expiredIds } }, data: { isActive: false } });
    }
    return activeUrls;
  } catch (error) {
    logger.error('Error getting all short URLs', error);
    return [];
  }
};

export const recordClick = async (shortcode: string, clickData: {
  referrer?: string;
  userAgent?: string;
  ip?: string;
  location?: string;
}) => {
  try {
    const shortUrl = await prisma.shortUrl.findUnique({ where: { shortcode }, select: { id: true } });
    if (!shortUrl) return;
    await prisma.click.create({
      data: {
        shortUrlId: shortUrl.id,
        referrer: clickData.referrer,
        userAgent: clickData.userAgent,
        ip: clickData.ip,
        location: clickData.location,
      },
    });
    logger.info('Click recorded', { shortcode });
  } catch (error) {
    logger.error('Error recording click', error, { shortcode });
  }
};

export const getShortUrlStats = async (shortcode: string) => {
  try {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortcode },
      include: { clicks: { orderBy: { timestamp: 'desc' } } },
    });
    if (!shortUrl || !shortUrl.isActive) return null;
    if (new Date() > shortUrl.expiresAt) return null;
    return {
      shortcode: shortUrl.shortcode,
      originalUrl: shortUrl.originalUrl,
      shortLink: shortUrl.shortcode,
      createdAt: shortUrl.createdAt,
      expiresAt: shortUrl.expiresAt,
      totalClicks: shortUrl.clicks.length,
      clicks: shortUrl.clicks,
    };
  } catch (error) {
    logger.error('Error getting short URL statistics', error, { shortcode });
    return null;
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
};

export const close = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', error);
  }
};
