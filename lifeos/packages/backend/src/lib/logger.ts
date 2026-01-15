import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Only use pino-pretty in development and when not in serverless environment
const usePrettyPrint = !isProduction && !isTest && !process.env.VERCEL && !process.env.RENDER;

const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  ...(usePrettyPrint && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: isTest ? undefined : {
    env: process.env.NODE_ENV,
  },
  redact: ['req.headers.authorization', 'password', 'token'],
});

export default logger;
