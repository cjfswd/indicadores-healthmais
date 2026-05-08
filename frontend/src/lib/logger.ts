export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`%c[INFO] %c${message}`, 'color: #3b82f6; font-weight: bold;', 'color: inherit;', meta ? meta : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`%c[WARN] %c${message}`, 'color: #eab308; font-weight: bold;', 'color: inherit;', meta ? meta : '');
  },
  error: (message: string, error?: any) => {
    console.error(`%c[ERROR] %c${message}`, 'color: #ef4444; font-weight: bold;', 'color: inherit;', error ? error : '');
  },
  debug: (message: string, meta?: any) => {
    console.debug(`%c[DEBUG] %c${message}`, 'color: #8b5cf6; font-weight: bold;', 'color: inherit;', meta ? meta : '');
  }
};
