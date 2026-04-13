import type { RequestHandler } from 'express';
import { z } from 'zod';

import { votingService } from '../services/voting.service.js';
import { AppError } from '../utils/app-error.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const electionIdParamSchema = z.object({
  electionId: z.string().uuid('O electionId deve ser um UUID válido.'),
});

const castVoteSchema = z.object({
  candidatoId: z.string().uuid('O candidatoId deve ser um UUID válido.'),
});

const getAuthenticatedUserId = (request: Parameters<RequestHandler>[0]) => {
  const userId = request.auth?.sub;

  if (!userId) {
    throw new AppError('O token de autenticação é obrigatório.', 401, 'AUTH_TOKEN_REQUIRED');
  }

  return userId;
};

export const getBallot: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const userId = getAuthenticatedUserId(request);
  const result = await votingService.getBallot(params.electionId, userId);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const castVote: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const body = castVoteSchema.parse(request.body);
  const userId = getAuthenticatedUserId(request);
  const result = await votingService.castVote(params.electionId, userId, body);

  response.status(201).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
      statusCode: 201,
    }),
  );
};

export const getMyVoteStatus: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const userId = getAuthenticatedUserId(request);
  const result = await votingService.getMyVoteStatus(params.electionId, userId);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const getElectionResults: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const result = await votingService.getElectionResults(params.electionId);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};