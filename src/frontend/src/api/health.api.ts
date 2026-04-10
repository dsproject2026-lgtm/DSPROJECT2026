import { endpoints } from './endpoints';
import { apiClient } from './http';

export const healthApi = {
  getOverview() {
    return apiClient.get<Record<string, unknown>>(endpoints.health.overview);
  },
};
