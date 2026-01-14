import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV !== 'production' && !isTest;

const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: isTest ? undefined : {
    env: process.env.NODE_ENV,
  },
  redact: ['req.headers.authorization', 'password', 'token'],
});

export default logger;
