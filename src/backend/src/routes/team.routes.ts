import { Router } from 'express';

import { createTeamMember, listTeamMembers, updateTeamMemberStatus } from '../controllers/team.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const teamRouter = Router();

teamRouter.get('/', authenticateAccessToken, requirePerfis('ADMIN'), listTeamMembers);
teamRouter.post('/', authenticateAccessToken, requirePerfis('ADMIN'), createTeamMember);
teamRouter.patch('/:id/status', authenticateAccessToken, requirePerfis('ADMIN'), updateTeamMemberStatus);

export default teamRouter;
