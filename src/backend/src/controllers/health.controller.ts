import type { RequestHandler } from 'express';

import { healthService } from '../services/health.service.js';
import { buildSuccessResponse } from '../utils/success-response.js';

export const getHealthOverview: RequestHandler = async (request, response) => {
  const result = await healthService.getOverview();

  response.status(result.httpStatus).json(
    buildSuccessResponse({
      message: 'Health overview loaded successfully.',
      data: result.payload,
      request,
      statusCode: result.httpStatus,
    }),
  );
};

export const getLiveness: RequestHandler = (request, response) => {
  response.status(200).json(
    buildSuccessResponse({
      message: 'Liveness check completed successfully.',
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
          ? 'Readiness check completed successfully.'
          : 'Readiness check completed with degraded status.',
      data: result.payload,
      request,
      statusCode: result.httpStatus,
    }),
  );
};
