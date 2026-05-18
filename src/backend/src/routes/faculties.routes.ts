import { Router } from 'express';

import { addCourses, createFaculty, listFaculties } from '../controllers/faculties.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const facultiesRouter = Router();

facultiesRouter.get('/', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR'), listFaculties);
facultiesRouter.post('/', authenticateAccessToken, requirePerfis('ADMIN'), createFaculty);
facultiesRouter.post('/:id/courses', authenticateAccessToken, requirePerfis('ADMIN'), addCourses);

export default facultiesRouter;
