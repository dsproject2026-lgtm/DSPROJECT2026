import { Router } from 'express';

import {
  finishFirstAccess,
  finishLogin,
  finishPasswordRecovery,
  getCurrentUser,
  logout,
  refreshAccessToken,
  registerUser,
  startFirstAccess,
  startLogin,
  startPasswordRecovery,
} from '../controllers/auth.controller.js';
import { authenticateAccessToken } from '../middlewares/auth.middleware.js';
import { authRateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';

const authRouter = Router();

authRouter.post('/register', authRateLimitMiddleware, registerUser);
authRouter.post('/login/start', authRateLimitMiddleware, startLogin);
authRouter.post('/login/finish', authRateLimitMiddleware, finishLogin);
authRouter.post('/refresh', authRateLimitMiddleware, refreshAccessToken);
authRouter.post('/logout', authRateLimitMiddleware, logout);
authRouter.post('/first-access/start', authRateLimitMiddleware, startFirstAccess);
authRouter.post('/first-access/finish', authRateLimitMiddleware, finishFirstAccess);
authRouter.post('/password-recovery/start', authRateLimitMiddleware, startPasswordRecovery);
authRouter.post('/password-recovery/finish', authRateLimitMiddleware, finishPasswordRecovery);
authRouter.get('/me', authenticateAccessToken, getCurrentUser);

export default authRouter;
