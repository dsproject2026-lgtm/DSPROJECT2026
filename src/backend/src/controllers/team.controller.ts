import type { RequestHandler } from 'express';
import { z } from 'zod';

import { teamService } from '../services/team.service.js';
import { auditService } from '../services/audit.service.js';
import { getClientIp } from '../utils/get-client-ip.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const createTeamMemberSchema = z.object({
  nome: z.string().trim().min(3).max(150),
  email: z.string().trim().email().max(255),
  perfil: z.enum(['GESTOR_ELEITORAL', 'AUDITOR']),
});

const updateTeamMemberStatusSchema = z.object({
  activo: z.boolean(),
});

const teamMemberIdSchema = z.object({
  id: z.string().uuid(),
});

export const listTeamMembers: RequestHandler = async (request, response) => {
  const result = await teamService.listMembers();

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

export const createTeamMember: RequestHandler = async (request, response) => {
  const body = createTeamMemberSchema.parse(request.body);
  const result = await teamService.createMember(body);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: 'MEMBRO_EQUIPA_CRIADO',
    entidade: 'TEAM',
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

export const updateTeamMemberStatus: RequestHandler = async (request, response) => {
  const params = teamMemberIdSchema.parse(request.params);
  const body = updateTeamMemberStatusSchema.parse(request.body);
  const result = await teamService.updateStatus(params.id, body.activo);
  await auditService.record({
    utilizadorId: request.auth?.sub,
    accao: body.activo ? 'MEMBRO_EQUIPA_ACTIVADO' : 'MEMBRO_EQUIPA_DESACTIVADO',
    entidade: 'TEAM',
    entidadeId: params.id,
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
