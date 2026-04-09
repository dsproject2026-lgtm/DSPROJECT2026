import { Router } from 'express';

import { finishLogin, registerUser, startLogin } from '../controllers/auth.controller.js';
import { authRateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';

const authRouter = Router();

authRouter.post('/register', authRateLimitMiddleware, registerUser);
authRouter.post('/login/start', authRateLimitMiddleware, startLogin);
authRouter.post('/login/finish', authRateLimitMiddleware, finishLogin);

export default authRouter;
