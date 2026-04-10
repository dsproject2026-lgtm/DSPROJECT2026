import { Router } from 'express';

import { env } from '../config/env.js';
import { buildSuccessResponse } from '../utils/success-response.js';
import authRouter from './auth.routes.js';
import eventsRouter from './events.routes.js';
import healthRouter from './health.routes.js';

const apiRouter = Router();

apiRouter.get('/', (request, response) => {
  response.status(200).json(
    buildSuccessResponse({
      message: 'API root loaded successfully.',
      data: {
        service: 'DSPROJECT2026 backend',
        version: '1.0.0',
        endpoints: {
          authRegister: `${env.API_PREFIX}/auth/register`,
          authLoginStart: `${env.API_PREFIX}/auth/login/start`,
          authLoginFinish: `${env.API_PREFIX}/auth/login/finish`,
          authRefresh: `${env.API_PREFIX}/auth/refresh`,
          authLogout: `${env.API_PREFIX}/auth/logout`,
          authMe: `${env.API_PREFIX}/auth/me`,
          authFirstAccessStart: `${env.API_PREFIX}/auth/first-access/start`,
          authFirstAccessFinish: `${env.API_PREFIX}/auth/first-access/finish`,
          health: `${env.API_PREFIX}/health`,
          liveness: `${env.API_PREFIX}/health/live`,
          readiness: `${env.API_PREFIX}/health/ready`,
          sseStream: `${env.API_PREFIX}/events/stream`,
          sseStats: `${env.API_PREFIX}/events/stats`,
        },
      },
      request,
    }),
  );
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/events', eventsRouter);

export default apiRouter;
