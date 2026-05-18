import type { CandidateListResponse, UpdateCandidateInput } from '@/types/commission';

import { endpoints } from './endpoints';
import { apiClient } from './http';

export const candidateApi = {
  listMine() {
    return apiClient.get<CandidateListResponse>(endpoints.candidates.me, { auth: true });
  },

  updateMine(electionId: string, candidateId: string, payload: UpdateCandidateInput) {
    return apiClient.patch(endpoints.candidates.updateMine(electionId, candidateId), payload, {
      auth: true,
    });
  },
};
