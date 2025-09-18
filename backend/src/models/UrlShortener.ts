// Type definitions for URL Shortener
export interface ClickData {
  id: string;
  timestamp: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  location?: string;
}

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortcode: string;
  shortLink: string;
  createdAt: string;
  expiresAt: string;
  validity: number; // in minutes
  clicks: ClickData[];
  isActive: boolean;
}

export interface CreateShortUrlRequest {
  url: string;
  validity?: number;
  shortcode?: string;
}

export interface CreateShortUrlResponse {
  shortLink: string;
  expiry: string;
}

export interface ShortUrlStats {
  shortcode: string;
  originalUrl: string;
  shortLink: string;
  createdAt: string;
  expiresAt: string;
  totalClicks: number;
  clicks: ClickData[];
}
