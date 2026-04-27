import { Router } from 'express';

import {
  changePassword,
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

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login/start', startLogin);
authRouter.post('/login/finish', finishLogin);
authRouter.post('/refresh', refreshAccessToken);
authRouter.post('/logout', logout);
authRouter.post('/first-access/start', startFirstAccess);
authRouter.post('/first-access/finish', finishFirstAccess);
authRouter.post('/password-recovery/start', startPasswordRecovery);
authRouter.post('/password-recovery/finish', finishPasswordRecovery);
authRouter.post('/change-password', authenticateAccessToken, changePassword);
authRouter.get('/me', authenticateAccessToken, getCurrentUser);

export default authRouter;
