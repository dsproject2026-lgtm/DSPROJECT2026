import type { SystemSettingsResponse, UpdateSystemSettingsInput } from '@/types/settings';

import { endpoints } from './endpoints';
import { apiClient } from './http';

export const settingsApi = {
  getSystemSettings() {
    return apiClient.get<SystemSettingsResponse>(endpoints.settings.system, { auth: true });
  },

  updateSystemSettings(payload: UpdateSystemSettingsInput) {
    return apiClient.patch<SystemSettingsResponse>(endpoints.settings.system, payload, {
      auth: true,
    });
  },
};
