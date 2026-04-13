import type { RequestHandler } from 'express';
import { z } from 'zod';

import { positionsService } from '../services/positions.service.js';
import type { UpdatePositionApiInput } from '../types/positions.types.js';
import { AppError } from '../utils/app-error.js';
import { buildSuccessResponse } from '../utils/success-response.js';

// ─────────────────────────────────────────────
// SCHEMAS DE VALIDAÇÃO (Zod)
// ─────────────────────────────────────────────

const createPositionSchema = z.object({
  nome: z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(100),
  descricao: z.string().trim().max(1000).optional().nullable(),
});

const updatePositionSchema = z.object({
  nome: z.string().trim().min(3).max(100).optional(),
  descricao: z.string().trim().max(1000).optional().nullable(),
});

const listPositionsQuerySchema = z.object({
  nome: z.string().trim().optional(),
});

// ─────────────────────────────────────────────
// HANDLERS (CONTROLLER METHODS)
// ─────────────────────────────────────────────

export const createPosition: RequestHandler = async (request, response) => {
  const body = createPositionSchema.parse(request.body);
  const result = await positionsService.createPosition(body);
  response.status(201).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
      statusCode: 201,
    }),
  );
};

export const getPositionById: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID do cargo não fornecido.', 400, 'POSITION_ID_REQUIRED');
  }
  const result = await positionsService.getPositionById(id);
  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const listPositions: RequestHandler = async (request, response) => {
  const query = listPositionsQuerySchema.parse(request.query);

  const filters = Object.keys(query).length > 0 ? query : undefined;

  const result = await positionsService.listPositions(filters);

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

export const updatePosition: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID do cargo não fornecido.', 400, 'POSITION_ID_REQUIRED');
  }
  const body = updatePositionSchema.parse(request.body) as UpdatePositionApiInput;
  const result = await positionsService.updatePosition(id, body);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const deletePosition: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID do cargo não fornecido.', 400, 'POSITION_ID_REQUIRED');
  }

  const result = await positionsService.deletePosition(id);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};
