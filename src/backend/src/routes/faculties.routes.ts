import { Router } from 'express';

import {
  addCourses,
  createFaculty,
  deleteFaculty,
  getFacultyById,
  listFaculties,
  updateFaculty,
} from '../controllers/faculties.controller.js';
import { authenticateAccessToken, requirePerfis } from '../middlewares/auth.middleware.js';

const facultiesRouter = Router();

facultiesRouter.get('/', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR'), listFaculties);
facultiesRouter.get('/:id', authenticateAccessToken, requirePerfis('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR'), getFacultyById);
facultiesRouter.post('/', authenticateAccessToken, requirePerfis('ADMIN'), createFaculty);
facultiesRouter.patch('/:id', authenticateAccessToken, requirePerfis('ADMIN'), updateFaculty);
facultiesRouter.delete('/:id', authenticateAccessToken, requirePerfis('ADMIN'), deleteFaculty);
facultiesRouter.post('/:id/courses', authenticateAccessToken, requirePerfis('ADMIN'), addCourses);

export default facultiesRouter;
