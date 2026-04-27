import { env } from '@/config/env';
import { sessionStorageService } from '@/lib/storage/session-storage';
import type {
  CandidateListResponse,
  CommissionElectionDetailsItem,
  CandidateUserListResponse,
  CommissionElectionListResponse,
  CreateCandidateInput,
  CreateElectionInput,
  EligibleVoterListResponse,
  ImportEligibleVotersResult,
  PositionListResponse,
  UpdateCandidateInput,
  UpdateElectionInput,
} from '@/types/commission';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api';

import { endpoints } from './endpoints';
import { apiClient } from './http';

function withQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value.trim() !== '') {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export const commissionApi = {
  listPositions() {
    return apiClient.get<PositionListResponse>(endpoints.positions.list, { auth: true });
  },

  listElections() {
    return apiClient.get<CommissionElectionListResponse>(endpoints.elections.list, { auth: true });
  },

  getElectionById(electionId: string) {
    return apiClient.get<CommissionElectionDetailsItem>(endpoints.elections.detail(electionId), {
      auth: true,
    });
  },

  listCandidateUsers(search?: string) {
    return apiClient.get<CandidateUserListResponse>(
      withQuery(endpoints.elections.candidateUsers, { search }),
      { auth: true },
    );
  },

  createElection(payload: CreateElectionInput) {
    return apiClient.post(endpoints.elections.create, payload, { auth: true });
  },

  updateElection(electionId: string, payload: UpdateElectionInput) {
    return apiClient.patch(endpoints.elections.update(electionId), payload, { auth: true });
  },

  deleteElection(electionId: string) {
    return apiClient.delete(endpoints.elections.remove(electionId), { auth: true });
  },

  listCandidates(
    electionId: string,
    filters?: { estado?: string; nome?: string; utilizadorId?: string },
  ) {
    return apiClient.get<CandidateListResponse>(
      withQuery(endpoints.elections.candidates.list(electionId), {
        estado: filters?.estado,
        nome: filters?.nome,
        utilizadorId: filters?.utilizadorId,
      }),
      { auth: true },
    );
  },

  createCandidate(electionId: string, payload: CreateCandidateInput) {
    return apiClient.post(
      endpoints.elections.candidates.list(electionId),
      payload,
      { auth: true },
    );
  },

  updateCandidate(electionId: string, candidateId: string, payload: UpdateCandidateInput) {
    return apiClient.patch(
      endpoints.elections.candidates.update(electionId, candidateId),
      payload,
      { auth: true },
    );
  },

  approveCandidate(electionId: string, candidateId: string) {
    return apiClient.patch(
      endpoints.elections.candidates.approve(electionId, candidateId),
      {},
      { auth: true },
    );
  },

  rejectCandidate(electionId: string, candidateId: string) {
    return apiClient.patch(
      endpoints.elections.candidates.reject(electionId, candidateId),
      {},
      { auth: true },
    );
  },

  suspendCandidate(electionId: string, candidateId: string) {
    return apiClient.patch(
      endpoints.elections.candidates.suspend(electionId, candidateId),
      {},
      { auth: true },
    );
  },

  deleteCandidate(electionId: string, candidateId: string) {
    return apiClient.delete(
      endpoints.elections.candidates.remove(electionId, candidateId),
      { auth: true },
    );
  },

  listEligibleVoters(
    electionId: string,
    filters?: { codigo?: string; nome?: string; jaVotou?: 'true' | 'false' },
  ) {
    return apiClient.get<EligibleVoterListResponse>(
      withQuery(endpoints.elections.eligibleVoters.list(electionId), {
        codigo: filters?.codigo,
        nome: filters?.nome,
        jaVotou: filters?.jaVotou,
      }),
      { auth: true },
    );
  },

  async importEligibleVotersCsv(electionId: string, csvContent: string) {
    const token = sessionStorageService.getAccessToken();
    const response = await fetch(
      `${env.apiBaseUrl}${endpoints.elections.eligibleVoters.importCsv(electionId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: csvContent,
      },
    );

    const json = (await response.json().catch(() => null)) as
      | ApiSuccessResponse<ImportEligibleVotersResult>
      | ApiErrorResponse
      | null;

    if (!response.ok || !json || json.success === false) {
      const message =
        json && json.success === false
          ? json.error.message
          : 'Falha ao importar eleitores elegíveis.';
      throw new Error(message);
    }

    return json.data;
  },
};
