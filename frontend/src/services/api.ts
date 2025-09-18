import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  try {
    logger.debug('API Request', { url, method: options?.method || 'GET' });
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw { response: { status: res.status, data } };
    }
    return data as T;
  } catch (error) {
    logger.error('API Error', error);
    throw error;
  }
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

export interface ClickData {
  timestamp: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  location?: string;
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

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortcode: string;
  shortLink: string;
  createdAt: string;
  expiresAt: string;
  validity: number;
  clicks: ClickData[];
  isActive: boolean;
}

export const createShortUrl = (data: CreateShortUrlRequest): Promise<CreateShortUrlResponse> =>
  request<CreateShortUrlResponse>('/shorturls', { method: 'POST', body: JSON.stringify(data) });

export const getShortUrlStats = (shortcode: string): Promise<ShortUrlStats> =>
  request<ShortUrlStats>(`/shorturls/${shortcode}`);

export const getAllShortUrls = (): Promise<ShortUrl[]> =>
  request<ShortUrl[]>('/shorturls');

export const healthCheck = (): Promise<unknown> => request<unknown>('/health');
