import type { RequestHandler } from 'express';

import { healthService } from '../services/health.service.js';
import { buildSuccessResponse } from '../utils/success-response.js';

export const getHealthOverview: RequestHandler = async (request, response) => {
  const result = await healthService.getOverview();

  response.status(result.httpStatus).json(
    buildSuccessResponse({
      message: 'Visão geral do estado do sistema carregada com sucesso.',
      data: result.payload,
      request,
      statusCode: result.httpStatus,
    }),
  );
};

export const getLiveness: RequestHandler = (request, response) => {
  response.status(200).json(
    buildSuccessResponse({
      message: 'Verificação de funcionamento concluída com sucesso.',
      data: healthService.getLiveness(),
      request,
    }),
  );
};

export const getReadiness: RequestHandler = async (request, response) => {
  const result = await healthService.getReadiness();

  response.status(result.httpStatus).json(
    buildSuccessResponse({
      message:
        result.httpStatus === 200
          ? 'Verificação de disponibilidade concluída com sucesso.'
          : 'Verificação de disponibilidade concluída com estado degradado.',
      data: result.payload,
      request,
      statusCode: result.httpStatus,
    }),
  );
};
