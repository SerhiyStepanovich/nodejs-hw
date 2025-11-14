import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res) => {
    return `Request completed with status ${res.statusCode}`;
  },
});
