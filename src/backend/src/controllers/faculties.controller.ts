import type { RequestHandler } from 'express';
import { z } from 'zod';

import { facultiesService } from '../services/faculties.service.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const createFacultySchema = z.object({
  nome: z.string().trim().min(2).max(150),
  cursos: z.array(z.string().trim().min(2).max(150)).optional(),
});

const addCoursesSchema = z.object({
  cursos: z.array(z.string().trim().min(2).max(150)).min(1),
});

const facultyIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listFaculties: RequestHandler = async (request, response) => {
  const result = await facultiesService.listFaculties();

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: {
        items: result.data,
        count: result.count,
      },
      request,
    }),
  );
};

export const createFaculty: RequestHandler = async (request, response) => {
  const body = createFacultySchema.parse(request.body);
  const result = await facultiesService.createFaculty(body);

  response.status(201).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
      statusCode: 201,
    }),
  );
};

export const addCourses: RequestHandler = async (request, response) => {
  const params = facultyIdParamSchema.parse(request.params);
  const body = addCoursesSchema.parse(request.body);
  const result = await facultiesService.addCourses(params.id, body.cursos);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};
