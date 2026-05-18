import { Router } from 'express';

import {
    approveCandidate,
    createCandidate,
    deleteCandidate,
    getCandidateById,
    listMyCandidacies,
    listCandidates,
    rejectCandidate,
    suspendCandidate,
    updateCandidate,
} from '../controllers/candidates.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const candidatesRouter = Router({ mergeParams: true });

candidatesRouter.get('/me', authenticateAccessToken, requirePerfis('CANDIDATO'), listMyCandidacies);
candidatesRouter.get('/', listCandidates);
candidatesRouter.get('/:id', getCandidateById);

candidatesRouter.post('/', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL'), createCandidate,);

candidatesRouter.patch('/:id', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL'), updateCandidate,);
candidatesRouter.patch('/:id/approve', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL'), approveCandidate,);
candidatesRouter.patch('/:id/reject', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL'), rejectCandidate,);
candidatesRouter.patch('/:id/suspend', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL'), suspendCandidate,);

candidatesRouter.delete('/:id', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL'), deleteCandidate,);

export default candidatesRouter;
