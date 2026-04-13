import { Router } from 'express';

import {
  createPosition,
  deletePosition,
  getPositionById,
  listPositions,
  updatePosition,
} from '../controllers/positions.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const positionsRouter = Router();
// PUBLIC ROUTES (read-only for auditors)
positionsRouter.get('/', listPositions);


positionsRouter.get('/:id', getPositionById);


// PROTECTED ROUTES (requires authentication + specific profiles)
positionsRouter.post(
  '/',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  createPosition,
);

positionsRouter.put('/:id',authenticateAccessToken,requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),updatePosition,);

positionsRouter.delete('/:id',authenticateAccessToken,requirePerfis('ADMIN'),deletePosition,);

export default positionsRouter;
