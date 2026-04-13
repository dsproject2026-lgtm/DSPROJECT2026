import { Router } from 'express';

import { castVote, getBallot, getElectionResults, getMyVoteStatus } from '../controllers/voting.controller.js';

import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';
const votingRouter = Router({ mergeParams: true });

votingRouter.get('/ballot', authenticateAccessToken, getBallot);
votingRouter.post('/votes', authenticateAccessToken, requirePerfis('CANDIDATO', 'ELEITOR'), castVote);
votingRouter.get('/votes/me/status', authenticateAccessToken, getMyVoteStatus);
votingRouter.get('/results', authenticateAccessToken, getElectionResults);

export default votingRouter;