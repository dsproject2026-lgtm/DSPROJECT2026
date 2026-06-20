import { Router, text } from 'express';

import {
  deleteEligibleVoter,
  importEligibleVoters,
  listEligibleVoters,
  previewEligibleVoters,
  updateEligibleVoter,
  updateEligibleVoterStatus,
} from '../controllers/eligible-voters.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const eligibleVotersRouter = Router({ mergeParams: true });
const csvParser = text({ type: ['text/csv', 'text/plain'], limit: '1mb' });

eligibleVotersRouter.get(
  '/',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR'),
  listEligibleVoters,
);

eligibleVotersRouter.post(
  '/preview-csv',
  csvParser,
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  previewEligibleVoters,
);

eligibleVotersRouter.post(
  '/preview',
  csvParser,
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  previewEligibleVoters,
);

eligibleVotersRouter.post(
  '/import-csv',
  csvParser,
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  importEligibleVoters,
);

eligibleVotersRouter.patch(
  '/:id',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  updateEligibleVoter,
);

eligibleVotersRouter.patch(
  '/:id/status',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  updateEligibleVoterStatus,
);

eligibleVotersRouter.delete(
  '/:id',
  authenticateAccessToken,
  requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),
  deleteEligibleVoter,
);

export default eligibleVotersRouter;
