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

type RawPositionItem = Omit<PositionItem, 'eleicoes'> & {
  eleicoes?:
    | NonNullable<PositionItem['eleicoes']>
    | NonNullable<PositionItem['eleicoes']>[number]
    | null;
};

type RawPositionListResponse = Omit<PositionListResponse, 'items'> & {
  items: RawPositionItem[];
};

function normalizePosition(position: RawPositionItem): PositionItem {
  const eleicoes =
    position.eleicoes == null
      ? []
      : Array.isArray(position.eleicoes)
        ? position.eleicoes
        : [position.eleicoes];

  return {
    ...position,
    eleicoes,
  };
}

export const positionsApi = {
  async list(search?: string) {
    const response = await apiClient.get<RawPositionListResponse>(
      withQuery(endpoints.positions.list, { nome: search }),
      { auth: true },
    );

    return {
      ...response,
      items: response.items.map(normalizePosition),
    };
  },

  async create(payload: CreatePositionInput) {
    const response = await apiClient.post<RawPositionItem>(endpoints.positions.create, payload, {
      auth: true,
    });

    return normalizePosition(response);
  },

  delete(positionId: string) {
    return apiClient.delete(endpoints.positions.remove(positionId), { auth: true });
  },
};
