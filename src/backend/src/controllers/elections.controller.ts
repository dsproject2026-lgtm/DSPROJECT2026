import type { RequestHandler } from 'express';
import { z } from 'zod';

import { electionsService } from '../services/elections.service.js';
import type { UpdateElectionApiInput } from '../types/eleicoes.types.js';
import { ESTADOS_ELEICAO } from '../types/model.types.js';
import { AppError } from '../utils/app-error.js';
import { buildSuccessResponse } from '../utils/success-response.js';

// ─────────────────────────────────────────────
// SCHEMAS DE VALIDAÇÃO (Zod)
// ─────────────────────────────────────────────

const createElectionSchema = z.object({
  cargoId: z.string().uuid('O cargoId deve ser um UUID válido.'),
  titulo: z.string().trim().min(3, 'O título deve ter pelo menos 3 caracteres.').max(200),
  descricao: z.string().trim().max(1000).optional().nullable(),
  estado: z.enum(ESTADOS_ELEICAO).optional(),
  dataInicioCandidatura: z.string().datetime().optional().nullable(),
  dataFimCandidatura: z.string().datetime().optional().nullable(),
  dataInicioVotacao: z.string().datetime().optional().nullable(),
  dataFimVotacao: z.string().datetime().optional().nullable(),
});
const updateElectionSchema = z.object({
  cargoId: z.string().uuid().optional(),
  titulo: z.string().trim().min(3).max(200).optional(),
  descricao: z.string().trim().max(1000).optional().nullable(),
  estado: z.enum(ESTADOS_ELEICAO).optional(),
  dataInicioCandidatura: z.string().datetime().optional().nullable(),
  dataFimCandidatura: z.string().datetime().optional().nullable(),
  dataInicioVotacao: z.string().datetime().optional().nullable(),
  dataFimVotacao: z.string().datetime().optional().nullable(),
});
const listElectionsQuerySchema = z.object({
  estado: z.enum(ESTADOS_ELEICAO).optional(),
  cargoId: z.string().uuid().optional(),
});
// ─────────────────────────────────────────────
// HANDLERS (CONTROLLER METHODS)
// ─────────────────────────────────────────────
export const createElection: RequestHandler = async (request, response) => {
  const body = createElectionSchema.parse(request.body);
  const result = await electionsService.createElection(body);
  response.status(201).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
      statusCode: 201,
    }),
  );
};

export const getElectionById: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID da eleição não fornecido.', 400, 'ELECTION_ID_REQUIRED');
  }
  const result = await electionsService.getElectionById(id);
  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};
export const listElections: RequestHandler = async (request, response) => {
  const query = listElectionsQuerySchema.parse(request.query);

  const filters = Object.keys(query).length > 0 ? query : undefined;

  const result = await electionsService.listElections(filters);

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

export const updateElection: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID da eleição não fornecido.', 400, 'ELECTION_ID_REQUIRED');
  }
  const body = updateElectionSchema.parse(request.body) as UpdateElectionApiInput;
  const result = await electionsService.updateElection(id, body);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const deleteElection: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID da eleição não fornecido.', 400, 'ELECTION_ID_REQUIRED');
  }

  const result = await electionsService.deleteElection(id);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};
