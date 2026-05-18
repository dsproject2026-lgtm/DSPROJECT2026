import { Router } from 'express';

import { listMyCandidacies, updateCandidate } from '../controllers/candidates.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const candidateSelfRouter = Router();

candidateSelfRouter.get('/me', authenticateAccessToken, requirePerfis('CANDIDATO'), listMyCandidacies);
candidateSelfRouter.patch(
  '/:electionId/:id',
  authenticateAccessToken,
  requirePerfis('CANDIDATO'),
  updateCandidate,
);

export default candidateSelfRouter;
