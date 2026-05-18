import type { RequestHandler } from 'express';
import { z } from 'zod';

import { candidatesService } from '../services/candidates.service.js';
import { auditService } from '../services/audit.service.js';
import type { UpdateCandidateApiInput } from '../types/candidates.types.js';
import { ESTADOS_CANDIDATO } from '../types/model.types.js';
import { AppError } from '../utils/app-error.js';
import { getClientIp } from '../utils/get-client-ip.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const createCandidateSchema = z.object({
    utilizadorId: z.string().uuid('O utilizadorId deve ser um UUID valido.'),
    nome: z.string().trim().min(3).max(150).optional(),
});

const updateCandidateSchema = z.object({
    utilizadorId: z.string().uuid().optional(),
    nome: z.string().trim().min(3).max(150).optional(),
    fotoUrl: z.string().trim().max(2_000_000).optional().nullable(),
    biografia: z.string().trim().max(3_000).optional().nullable(),
    proposta: z.string().trim().max(5_000).optional().nullable(),
    estado: z.enum(ESTADOS_CANDIDATO).optional(),
});

const listCandidatesQuerySchema = z.object({
    estado: z.enum(ESTADOS_CANDIDATO).optional(),
    nome: z.string().trim().optional(),
    utilizadorId: z.string().uuid().optional(),
});

const electionIdParamSchema = z.object({
    electionId: z.string().uuid('O electionId deve ser um UUID valido.'),
});

const candidateIdParamSchema = z.object({
    id: z.string().uuid('O id do candidato deve ser um UUID valido.'),
});

export const createCandidate: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.parse(request.params);
    const body = createCandidateSchema.parse(request.body);
    const result = await candidatesService.createCandidate(params.electionId, body, request.auth?.sub);
    await auditService.record({
        utilizadorId: request.auth?.sub,
        accao: 'CANDIDATO_REGISTADO',
        entidade: 'CANDIDATO',
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

export const getCandidateById: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.merge(candidateIdParamSchema).parse(request.params);
    const result = await candidatesService.getCandidateById(params.electionId, params.id);

    response.status(200).json(
        buildSuccessResponse({
            message: result.message,
            data: result.data,
            request,
        }),
    );
};

export const listCandidates: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.parse(request.params);
    const query = listCandidatesQuerySchema.parse(request.query);
    const filters = Object.keys(query).length > 0 ? query : undefined;
    const result = await candidatesService.listCandidates(params.electionId, filters);

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

export const listMyCandidacies: RequestHandler = async (request, response) => {
    if (!request.auth?.sub) {
        throw new AppError('Utilizador autenticado nao encontrado.', 401, 'AUTH_REQUIRED');
    }

    const result = await candidatesService.listMyCandidacies(request.auth.sub);

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

export const updateCandidate: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.merge(candidateIdParamSchema).parse(request.params);
    const body = updateCandidateSchema.parse(request.body) as UpdateCandidateApiInput;

    if (Object.keys(body).length === 0) {
        throw new AppError(
            'Pelo menos um campo deve ser informado para atualizacao.',
            400,
            'CANDIDATE_UPDATE_EMPTY_PAYLOAD',
        );
    }

    const result = await candidatesService.updateCandidate(
        params.electionId,
        params.id,
        body,
        request.auth?.sub,
    );
    await auditService.record({
        utilizadorId: request.auth?.sub,
        accao: 'CANDIDATO_ACTUALIZADO',
        entidade: 'CANDIDATO',
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

export const deleteCandidate: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.merge(candidateIdParamSchema).parse(request.params);
    const result = await candidatesService.deleteCandidate(params.electionId, params.id);
    await auditService.record({
        utilizadorId: request.auth?.sub,
        accao: 'CANDIDATO_ELIMINADO',
        entidade: 'CANDIDATO',
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

export const approveCandidate: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.merge(candidateIdParamSchema).parse(request.params);
    const result = await candidatesService.approveCandidate(params.electionId, params.id);
    await auditService.record({ utilizadorId: request.auth?.sub, accao: 'CANDIDATO_APROVADO', entidade: 'CANDIDATO', entidadeId: params.electionId, ip: getClientIp(request) });

    response.status(200).json(buildSuccessResponse({ message: result.message, data: result.data, request }));
};

export const rejectCandidate: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.merge(candidateIdParamSchema).parse(request.params);
    const result = await candidatesService.rejectCandidate(params.electionId, params.id);
    await auditService.record({ utilizadorId: request.auth?.sub, accao: 'CANDIDATO_REJEITADO', entidade: 'CANDIDATO', entidadeId: params.electionId, ip: getClientIp(request) });

    response.status(200).json(buildSuccessResponse({ message: result.message, data: result.data, request }));
};

export const suspendCandidate: RequestHandler = async (request, response) => {
    const params = electionIdParamSchema.merge(candidateIdParamSchema).parse(request.params);
    const result = await candidatesService.suspendCandidate(params.electionId, params.id);
    await auditService.record({ utilizadorId: request.auth?.sub, accao: 'CANDIDATO_SUSPENSO', entidade: 'CANDIDATO', entidadeId: params.electionId, ip: getClientIp(request) });

    response.status(200).json(buildSuccessResponse({ message: result.message, data: result.data, request }));
};
