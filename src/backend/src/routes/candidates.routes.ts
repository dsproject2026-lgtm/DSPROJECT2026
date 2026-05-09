import { Router } from 'express';

import {
  approveCandidate,
  createCandidate,
  deleteCandidate,
  getCandidateById,
  listCandidates,
  rejectCandidate,
  suspendCandidate,
  updateCandidate,
} from '../controllers/candidates.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const candidatesRouter = Router({ mergeParams: true });
const canManageCandidates = requirePerfis('GESTOR_ELEITORAL', 'ADMIN');

candidatesRouter.get('/', listCandidates);
candidatesRouter.get('/:id', getCandidateById);

candidatesRouter.post('/', authenticateAccessToken, canManageCandidates, createCandidate);

candidatesRouter.patch('/:id', authenticateAccessToken, canManageCandidates, updateCandidate);
candidatesRouter.patch(
  '/:id/approve',
  authenticateAccessToken,
  canManageCandidates,
  approveCandidate,
);
candidatesRouter.patch(
  '/:id/reject',
  authenticateAccessToken,
  canManageCandidates,
  rejectCandidate,
);
candidatesRouter.patch(
  '/:id/suspend',
  authenticateAccessToken,
  canManageCandidates,
  suspendCandidate,
);

candidatesRouter.delete('/:id', authenticateAccessToken, canManageCandidates, deleteCandidate);

export default candidatesRouter;
