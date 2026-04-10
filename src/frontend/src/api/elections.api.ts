import type { ElectionSummary } from '@/types/election';

import { endpoints } from './endpoints';
import { apiClient } from './http';

export const electionsApi = {
  list() {
    return apiClient.get<ElectionSummary[]>(endpoints.elections.list, { auth: true });
  },
};
