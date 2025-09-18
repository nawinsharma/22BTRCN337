export const logger = {
  info(message: string, meta?: unknown): void {
    console.log('[INFO]', message, meta || '');
  },
  warn(message: string, meta?: unknown): void {
    console.warn('[WARN]', message, meta || '');
  },
  error(message: string, error?: unknown, meta?: unknown): void {
    const maybeErr = error as { message?: string } | string | undefined;
    const detail = typeof maybeErr === 'string' ? maybeErr : maybeErr?.message || '';
    console.error('[ERROR]', message, detail, meta || '');
  },
  debug(message: string, meta?: unknown): void {
    if (import.meta.env.MODE !== 'production') {
      console.debug('[DEBUG]', message, meta || '');
    }
  }
};
