import type { RequestHandler } from 'express';
import { z } from 'zod';

import { settingsService } from '../services/settings.service.js';
import type { UpdateSystemSettingsInput } from '../types/settings.types.js';
import { buildSuccessResponse } from '../utils/success-response.js';

const updateSystemSettingsSchema = z.object({
  autoCloseElection: z.boolean().optional(),
  allowImmediateResults: z.boolean().optional(),
  requireEligibilityValidation: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  institutionName: z.string().trim().min(1).max(120).optional(),
});

export const getSystemSettings: RequestHandler = async (request, response) => {
  const result = await settingsService.getSystemSettings();

  response.status(200).json(
    buildSuccessResponse({
      message: 'Configurações carregadas com sucesso.',
      data: result,
      request,
    }),
  );
};

export const updateSystemSettings: RequestHandler = async (request, response) => {
  const body = updateSystemSettingsSchema.parse(request.body);
  const input: UpdateSystemSettingsInput = {};

  if (body.autoCloseElection !== undefined) input.autoCloseElection = body.autoCloseElection;
  if (body.allowImmediateResults !== undefined) input.allowImmediateResults = body.allowImmediateResults;
  if (body.requireEligibilityValidation !== undefined) {
    input.requireEligibilityValidation = body.requireEligibilityValidation;
  }
  if (body.maintenanceMode !== undefined) input.maintenanceMode = body.maintenanceMode;
  if (body.institutionName !== undefined) input.institutionName = body.institutionName;

  const result = await settingsService.updateSystemSettings(input);

  response.status(200).json(
    buildSuccessResponse({
      message: 'Configurações guardadas com sucesso.',
      data: result,
      request,
    }),
  );
};
