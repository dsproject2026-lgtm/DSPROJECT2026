import { Router } from 'express';

import { listAuditLogs } from '../controllers/audit.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const auditRouter = Router();

auditRouter.get('/', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR'), listAuditLogs);

export default auditRouter;
