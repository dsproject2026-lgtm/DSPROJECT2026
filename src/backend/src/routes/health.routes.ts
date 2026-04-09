import { Router } from 'express';

import { getHealthOverview, getLiveness, getReadiness } from '../controllers/health.controller.js';

const healthRouter = Router();

healthRouter.get('/', getHealthOverview);
healthRouter.get('/live', getLiveness);
healthRouter.get('/ready', getReadiness);

export default healthRouter;
