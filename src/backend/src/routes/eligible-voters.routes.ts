import { Router, text } from 'express';

import {importEligibleVoters,listEligibleVoters,} from '../controllers/eligible-voters.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const eligibleVotersRouter = Router({ mergeParams: true });

eligibleVotersRouter.get('/',authenticateAccessToken,requirePerfis('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR'),listEligibleVoters,);

eligibleVotersRouter.post('/import-csv',text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),authenticateAccessToken,requirePerfis('ADMIN', 'GESTOR_ELEITORAL'),importEligibleVoters,);
export default eligibleVotersRouter;