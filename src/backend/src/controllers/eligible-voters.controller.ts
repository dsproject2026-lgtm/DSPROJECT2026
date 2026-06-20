import type { RequestHandler } from 'express';
import { z } from 'zod';

import { eligibleVotersService } from '../services/eligible-voters.service.js';
import { auditService } from '../services/audit.service.js';
import { AppError } from '../utils/app-error.js';
import { getClientIp } from '../utils/get-client-ip.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const electionIdParamSchema = z.object({
  electionId: z.string().uuid('O electionId deve ser um UUID válido.'),
});

const eligibleVoterIdParamSchema = z.object({
  id: z.string().uuid('O id do eleitor deve ser um UUID válido.'),
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

const updateEligibleVoterSchema = z.object({
  nome: z.string().trim().min(3).max(150).optional(),
  email: z.string().trim().email().max(255).optional().nullable(),
  ano: z.number().int().min(1).max(20).optional().nullable(),
});

const updateEligibleVoterStatusSchema = z.object({
  activo: z.boolean(),
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

export const previewEligibleVoters: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const csvContent = csvBodySchema.parse(request.body);
  const result = await eligibleVotersService.previewEligibleVoters(params.electionId, csvContent);

  response.status(200).json(
    buildSuccessResponse({
      message: result.message,
      data: result.data,
      request,
    }),
  );
};

export const importEligibleVoters: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.parse(request.params);
  const csvContent = csvBodySchema.parse(request.body);
  const result = await eligibleVotersService.importEligibleVoters(params.electionId, csvContent);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEITORES_IMPORTADOS',
    entidade: 'ELEITOR_ELEGIVEL',
    entidadeId: params.electionId,
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

export const updateEligibleVoter: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.merge(eligibleVoterIdParamSchema).parse(request.params);
  const body = updateEligibleVoterSchema.parse(request.body);

  if (Object.keys(body).length === 0) {
    throw new AppError('Informe pelo menos um campo para actualizar.', 400, 'ELIGIBLE_VOTER_EMPTY_PAYLOAD');
  }

  const result = await eligibleVotersService.updateEligibleVoter(params.electionId, params.id, body);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEITOR_ACTUALIZADO',
    entidade: 'ELEITOR_ELEGIVEL',
    entidadeId: params.electionId,
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

export const updateEligibleVoterStatus: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.merge(eligibleVoterIdParamSchema).parse(request.params);
  const body = updateEligibleVoterStatusSchema.parse(request.body);
  const result = await eligibleVotersService.updateEligibleVoterStatus(params.electionId, params.id, body.activo);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: body.activo ? 'ELEITOR_REACTIVADO' : 'ELEITOR_SUSPENSO',
    entidade: 'ELEITOR_ELEGIVEL',
    entidadeId: params.electionId,
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

export const deleteEligibleVoter: RequestHandler = async (request, response) => {
  const params = electionIdParamSchema.merge(eligibleVoterIdParamSchema).parse(request.params);
  const result = await eligibleVotersService.deleteEligibleVoter(params.electionId, params.id);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'ELEITOR_ELIMINADO',
    entidade: 'ELEITOR_ELEGIVEL',
    entidadeId: params.electionId,
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
