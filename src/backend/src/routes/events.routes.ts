import { Router } from 'express';

import { getEventStreamStats, openEventStream } from '../controllers/events.controller.js';
import { sseRateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';

const eventsRouter = Router();

eventsRouter.get('/stream', sseRateLimitMiddleware, openEventStream);
eventsRouter.get('/stats', getEventStreamStats);

export default eventsRouter;
