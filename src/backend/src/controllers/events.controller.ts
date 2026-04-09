import type { RequestHandler } from 'express';

import { sseService } from '../sse/sse.service.js';
import { buildSuccessResponse } from '../utils/success-response.js';

export const openEventStream: RequestHandler = (request, response) => {
  sseService.connect(request, response);
};

export const getEventStreamStats: RequestHandler = (request, response) => {
  response.status(200).json(
    buildSuccessResponse({
      message: 'SSE stream statistics loaded successfully.',
      data: sseService.getStats(),
      request,
    }),
  );
};
