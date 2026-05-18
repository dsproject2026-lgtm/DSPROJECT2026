import type { RequestHandler } from 'express';
import { z } from 'zod';

import { auditService } from '../services/audit.service.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const listAuditLogsQuerySchema = z.object({
  electionId: z.string().uuid().optional(),
});

export const listAuditLogs: RequestHandler = async (request, response) => {
  const query = listAuditLogsQuerySchema.parse(request.query);
  const result = await auditService.listLogs(query);

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
