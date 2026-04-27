import { Router } from 'express';

import { getEventStreamStats, openEventStream } from '../controllers/events.controller.js';
import { authenticateAccessToken } from '../middlewares/auth.middleware.js';

const eventsRouter = Router();

eventsRouter.get('/stream', openEventStream);
eventsRouter.get('/stats', authenticateAccessToken, getEventStreamStats);

export default eventsRouter;
