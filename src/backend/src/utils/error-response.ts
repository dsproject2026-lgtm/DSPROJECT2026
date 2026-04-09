import type { Request } from 'express';

import { env } from '../config/env.js';
import type { ErrorResponsePayload } from '../types/error-response.types.js';

type BuildErrorResponseInput = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
  error?: Error;
  request: Request;
};

export const buildErrorResponse = ({
  code,
  message,
  statusCode,
  details,
  error,
  request,
}: BuildErrorResponseInput): ErrorResponsePayload => ({
  success: false,
  error: {
    code,
    message,
    statusCode,
    ...(details !== undefined ? { details } : {}),
    ...(env.NODE_ENV !== 'production' && error ? { stack: error.stack } : {}),
  },
  meta: {
    method: request.method,
    path: request.originalUrl,
    timestamp: new Date().toISOString(),
  },
});
