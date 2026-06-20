import { Router } from 'express';

import {
  createElection,
  deleteElection,
  getElectionById,
  listCandidateUsers,
  listElections,
  reopenElectionForTie,
  updateElection,
} from '../controllers/elections.controller.js';
import candidatesRouter from './candidates.routes.js';
import eligibleVotersRouter from './eligible-voters.routes.js';
import votingRouter from './voting.routes.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const electionsRouter = Router();

// ─────────────────────────────────────────────
// ROTAS PÚBLICAS (apenas leitura para auditores)
// ─────────────────────────────────────────────


electionsRouter.get('/', listElections);
electionsRouter.get(
  '/candidate-users',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  listCandidateUsers,
);

electionsRouter.use('/:electionId/candidates', candidatesRouter);
electionsRouter.use('/:electionId/eligible-voters', eligibleVotersRouter);
electionsRouter.use('/:electionId', votingRouter);

electionsRouter.patch('/:id', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), updateElection);
electionsRouter.post(
  '/:id/reopen-tie',
  authenticateAccessToken,
  requirePerfis('GESTOR_ELEITORAL'),
  reopenElectionForTie,
);
electionsRouter.get('/:id', getElectionById);

electionsRouter.post('/', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), createElection,);
//electionsRouter.put('/:id', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), updateElection,
//);
electionsRouter.delete('/:id', authenticateAccessToken, requirePerfis('GESTOR_ELEITORAL'), deleteElection,);

export default electionsRouter;
