import type { Request } from 'express';

import type { SuccessResponsePayload } from '../types/success-response.types.js';

type BuildSuccessResponseInput<TData> = {
  message: string;
  data: TData;
  request: Request;
  statusCode?: number;
};

export const buildSuccessResponse = <TData>({
  message,
  data,
  request,
  statusCode = 200,
}: BuildSuccessResponseInput<TData>): SuccessResponsePayload<TData> => ({
  success: true,
  message,
  data,
  meta: {
    method: request.method,
    path: request.originalUrl,
    timestamp: new Date().toISOString(),
    statusCode,
  },
});
