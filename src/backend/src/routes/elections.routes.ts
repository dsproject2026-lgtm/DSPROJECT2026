import { Router } from 'express';

import {
  createElection,
  deleteElection,
  getElectionById,
  listElections,
  updateElection,
} from '../controllers/elections.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const electionsRouter = Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTES (read-only for auditors)
// ─────────────────────────────────────────────

// GET /elections - List all elections (with optional filters)
electionsRouter.get('/', listElections);

// GET /elections/:id - Get election by ID
electionsRouter.get('/:id', getElectionById);

// ─────────────────────────────────────────────
// PROTECTED ROUTES (requires authentication + specific profiles)
// ─────────────────────────────────────────────
electionsRouter.post('/', createElection,);
// POST /elections - Create new election (ADMIN or GESTOR_ELEITORAL only)
//electionsRouter.post('/',authenticateAccessToken,requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),createElection,);

// PUT /elections/:id - Update election (ADMIN or GESTOR_ELEITORAL only)
electionsRouter.put(
  '/:id',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  updateElection,
);

// DELETE /elections/:id - Delete election (ADMIN only)
electionsRouter.delete(
  '/:id',
  authenticateAccessToken,
  requirePerfis('ADMIN'),
  deleteElection,
);

export default electionsRouter;
