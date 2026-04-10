import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { apiRateLimitMiddleware } from './middlewares/rate-limit.middleware.js';
import apiRoutes from './routes/index.js';
import { buildSuccessResponse } from './utils/success-response.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL ?? true,
      credentials: true,
    }),
  );
  app.use(
    compression({
      filter: (request, response) => {
        const acceptHeader = request.headers.accept;

        if (typeof acceptHeader === 'string' && acceptHeader.includes('text/event-stream')) {
          return false;
        }

        return compression.filter(request, response);
      },
    }),
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (request, response) => {
    response.status(200).json(
      buildSuccessResponse({
        message: 'Backend root loaded successfully.',
        data: {
          service: 'DSPROJECT2026 backend',
          apiPrefix: env.API_PREFIX,
          authRegister: `${env.API_PREFIX}/auth/register`,
          authLoginStart: `${env.API_PREFIX}/auth/login/start`,
          authLoginFinish: `${env.API_PREFIX}/auth/login/finish`,
          authRefresh: `${env.API_PREFIX}/auth/refresh`,
          authLogout: `${env.API_PREFIX}/auth/logout`,
          authMe: `${env.API_PREFIX}/auth/me`,
          authFirstAccessStart: `${env.API_PREFIX}/auth/first-access/start`,
          authFirstAccessFinish: `${env.API_PREFIX}/auth/first-access/finish`,
          health: `${env.API_PREFIX}/health`,
          events: `${env.API_PREFIX}/events/stream`,
        },
        request,
      }),
    );
  });

  app.use(env.API_PREFIX, apiRateLimitMiddleware, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
