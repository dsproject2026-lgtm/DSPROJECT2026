import { Router } from 'express';

import { env } from '../config/env.js';
import { buildSuccessResponse } from '../utils/success-response.js';
import authRouter from './auth.routes.js';
import electionsRouter from './elections.routes.js';
import positionsRouter from './positions.routes.js';
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
          authPasswordRecoveryStart: `${env.API_PREFIX}/auth/password-recovery/start`,
          authPasswordRecoveryFinish: `${env.API_PREFIX}/auth/password-recovery/finish`,
          health: `${env.API_PREFIX}/health`,
          liveness: `${env.API_PREFIX}/health/live`,
          readiness: `${env.API_PREFIX}/health/ready`,
          sseStream: `${env.API_PREFIX}/events/stream`,
          sseStats: `${env.API_PREFIX}/events/stats`,
          electionsList: `${env.API_PREFIX}/elections`,
          electionsCreate: `${env.API_PREFIX}/elections`,
          electionsDetail: `${env.API_PREFIX}/elections/:id`,
          electionsUpdate: `${env.API_PREFIX}/elections/:id`,
          electionsDelete: `${env.API_PREFIX}/elections/:id`,
          positionsList: `${env.API_PREFIX}/positions`,
          positionsCreate: `${env.API_PREFIX}/positions`,
          positionsDetail: `${env.API_PREFIX}/positions/:id`,
          positionsUpdate: `${env.API_PREFIX}/positions/:id`,
          positionsDelete: `${env.API_PREFIX}/positions/:id`,
        },
      },
      request,
    }),
  );
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/elections', electionsRouter);
apiRouter.use('/positions', positionsRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/events', eventsRouter);

export default apiRouter;

