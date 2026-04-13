import type { RequestHandler } from 'express';
import { z } from 'zod';

import { eligibleVotersService } from '../services/eligible-voters.service.js';
import { AppError } from '../utils/app-error.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const electionIdParamSchema = z.object({
  electionId: z.string().uuid('O electionId deve ser um UUID válido.'),
});

const eligibleVotersQuerySchema = z.object({
  codigo: z.string().trim().optional(),
  nome: z.string().trim().optional(),
  jaVotou:
    z
      .union([z.literal('true'), z.literal('false')])
      .transform((value) => value === 'true')
      .optional(),
});

const csvBodySchema = z.string().trim().min(1, 'O corpo CSV não pode estar vazio.');

export const listEligibleVoters: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const query = eligibleVotersQuerySchema.parse(request.query);
  const filters = Object.keys(query).length > 0 ? query : undefined;
  const result = await eligibleVotersService.listEligibleVoters(params.electionId, filters);

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

export const importEligibleVoters: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const csvContent = csvBodySchema.parse(request.body);
  const result = await eligibleVotersService.importEligibleVoters(params.electionId, csvContent);

  response.status(201).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
      statusCode: 201,
    }),
  );
};