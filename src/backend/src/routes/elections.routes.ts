import { Router } from 'express';

import {
  createElection,
  deleteElection,
  getElectionById,
  listElections,
  updateElection,
} from '../controllers/elections.controller.js';
import candidatesRouter from './candidates.routes.js';
import eligibleVotersRouter from './eligible-voters.routes.js';
import votingRouter from './voting.routes.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const electionsRouter = Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTES (read-only for auditors)
// ─────────────────────────────────────────────


electionsRouter.get('/', listElections);

electionsRouter.use('/:electionId/candidates', candidatesRouter);
electionsRouter.use('/:electionId/eligible-voters', eligibleVotersRouter);
electionsRouter.use('/:electionId', votingRouter);

electionsRouter.patch('/:id', updateElection,
);
electionsRouter.get('/:id', getElectionById);

electionsRouter.post('/', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), createElection,);
//electionsRouter.put('/:id', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), updateElection,
//);
electionsRouter.delete('/:id', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), deleteElection,);

export default electionsRouter;
