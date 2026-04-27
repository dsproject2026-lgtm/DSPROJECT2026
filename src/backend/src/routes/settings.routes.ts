import { Router } from 'express';

import { getSystemSettings, updateSystemSettings } from '../controllers/settings.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const settingsRouter = Router();

settingsRouter.get(
  '/',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  getSystemSettings,
);

settingsRouter.patch(
  '/',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  updateSystemSettings,
);

export default settingsRouter;
