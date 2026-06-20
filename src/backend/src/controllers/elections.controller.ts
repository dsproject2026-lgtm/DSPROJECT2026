import type { RequestHandler } from 'express';
import { z } from 'zod';

import { electionsService } from '../services/elections.service.js';
import { auditService } from '../services/audit.service.js';
import type { UpdateElectionApiInput } from '../types/eleicoes.types.js';
import { ESCOPOS_ELEITORES, ESTADOS_ELEICAO } from '../types/model.types.js';
import { AppError } from '../utils/app-error.js';
import { getClientIp } from '../utils/get-client-ip.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const createElectionSchema = z.object({
  cargoId: z.string().uuid('O cargoId deve ser um UUID valido.'),
  faculdadeId: z.string().uuid('A faculdadeId deve ser um UUID valido.').optional().nullable(),
  titulo: z.string().trim().min(3, 'O titulo deve ter pelo menos 3 caracteres.').max(200),
  descricao: z.string().trim().max(1000).optional().nullable(),
  escopoEleitores: z.enum(ESCOPOS_ELEITORES).optional(),
  dataInicioCandidatura: z.string().datetime().optional().nullable(),
  dataFimCandidatura: z.string().datetime().optional().nullable(),
  dataInicioVotacao: z.string().datetime().optional().nullable(),
  dataFimVotacao: z.string().datetime().optional().nullable(),
});

const updateElectionSchema = z.object({
  cargoId: z.string().uuid().optional(),
  faculdadeId: z.string().uuid().optional().nullable(),
  titulo: z.string().trim().min(3).max(200).optional(),
  descricao: z.string().trim().max(1000).optional().nullable(),
  estado: z.enum(ESTADOS_ELEICAO).optional(),
  escopoEleitores: z.enum(ESCOPOS_ELEITORES).optional(),
  dataInicioCandidatura: z.string().datetime().optional().nullable(),
  dataFimCandidatura: z.string().datetime().optional().nullable(),
  dataInicioVotacao: z.string().datetime().optional().nullable(),
  dataFimVotacao: z.string().datetime().optional().nullable(),
});

const listElectionsQuerySchema = z.object({
  estado: z.enum(ESTADOS_ELEICAO).optional(),
  cargoId: z.string().uuid().optional(),
  faculdadeId: z.string().uuid().optional(),
});

const listCandidateUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  electionId: z.string().uuid().optional(),
});

const reopenElectionForTieSchema = z.object({
  dataInicioVotacao: z.string().datetime(),
  dataFimVotacao: z.string().datetime(),
});

export const createElection: RequestHandler = async (request, response) => {
  const body = createElectionSchema.parse(request.body);
  const result = await electionsService.createElection(body, request.auth?.sub);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEICAO_CRIADA',
    entidade: 'ELEICAO',
    entidadeId: result.data.id,
    ip: getClientIp(request),
  });
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
    throw new AppError('ID da eleicao nao fornecido.', 400, 'ELECTION_ID_REQUIRED');
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

export const listCandidateUsers: RequestHandler = async (request, response) => {
  const query = listCandidateUsersQuerySchema.parse(request.query);
  const result = await electionsService.listCandidateUsers(query.search, query.electionId);

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
    throw new AppError('ID da eleicao nao fornecido.', 400, 'ELECTION_ID_REQUIRED');
  }

  const body = updateElectionSchema.parse(request.body) as UpdateElectionApiInput;
  const result = await electionsService.updateElection(id, body);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEICAO_ACTUALIZADA',
    entidade: 'ELEICAO',
    entidadeId: id,
    ip: getClientIp(request),
  });

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
    throw new AppError('ID da eleicao nao fornecido.', 400, 'ELECTION_ID_REQUIRED');
  }

  const result = await electionsService.deleteElection(id);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEICAO_ELIMINADA',
    entidade: 'ELEICAO',
    entidadeId: id,
    ip: getClientIp(request),
  });

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const reopenElectionForTie: RequestHandler = async (request, response) => {
  const { id } = request.params as { id?: string | string[] };

  if (!id || Array.isArray(id)) {
    throw new AppError('ID da eleição não fornecido.', 400, 'ELECTION_ID_REQUIRED');
  }

  const body = reopenElectionForTieSchema.parse(request.body);
  const result = await electionsService.reopenElectionForTie(id, body);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEICAO_REABERTA_DESEMPATE',
    entidade: 'ELEICAO',
    entidadeId: id,
    ip: getClientIp(request),
  });

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};
