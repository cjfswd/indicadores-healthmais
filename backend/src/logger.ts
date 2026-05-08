import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${stack || message} ${metaString}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    // Uncomment the line below to save logs to a file:
    // new winston.transports.File({ filename: 'logs/proxy.log' })
  ],
});
