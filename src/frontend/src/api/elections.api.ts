import type {
  CastVoteResult,
  ElectionBallot,
  ElectionListItem,
  ElectionListResponse,
  ElectionResults,
  VoteStatusResult,
} from '@/types/elector';

import { endpoints } from './endpoints';
import { apiClient } from './http';

export const electionsApi = {
  list() {
    return apiClient.get<ElectionListResponse>(endpoints.elections.list, { auth: true });
  },

  getById(electionId: string) {
    return apiClient.get<ElectionListItem>(endpoints.elections.detail(electionId), { auth: true });
  },

  getBallot(electionId: string) {
    return apiClient.get<ElectionBallot>(endpoints.elections.ballot(electionId), { auth: true });
  },

  castVote(electionId: string, candidatoId: string) {
    return apiClient.post<CastVoteResult>(
      endpoints.elections.vote(electionId),
      { candidatoId },
      { auth: true },
    );
  },

  getMyVoteStatus(electionId: string) {
    return apiClient.get<VoteStatusResult>(endpoints.elections.myVoteStatus(electionId), {
      auth: true,
    });
  },

  getResults(electionId: string) {
    return apiClient.get<ElectionResults>(endpoints.elections.results(electionId), { auth: true });
  },
};
