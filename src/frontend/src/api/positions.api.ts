import type { PositionItem, PositionListResponse } from '@/types/commission';

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

type CreatePositionInput = {
  nome: string;
  descricao?: string | null;
};

export const positionsApi = {
  list(search?: string) {
    return apiClient.get<PositionListResponse>(
      withQuery(endpoints.positions.list, { nome: search }),
      { auth: true },
    );
  },

  create(payload: CreatePositionInput) {
    return apiClient.post<PositionItem>(endpoints.positions.create, payload, { auth: true });
  },

  delete(positionId: string) {
    return apiClient.delete(endpoints.positions.remove(positionId), { auth: true });
  },
};
