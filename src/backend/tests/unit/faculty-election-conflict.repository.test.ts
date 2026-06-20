import { beforeEach, describe, expect, it, vi } from 'vitest';

type ElectionFindFirstArgs = {
  where: {
    cargoId: string;
    OR?: Array<Record<string, unknown>>;
  };
};

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn<(args: ElectionFindFirstArgs) => Promise<unknown>>(),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    eleicao: {
      findFirst: findFirstMock,
    },
  },
}));

import { electionsRepository } from '../../src/repositories/elections.repository.js';

describe('Conflitos de eleições por faculdade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstMock.mockResolvedValue(null);
  });

  it('procura conflito apenas na mesma faculdade ou numa eleição geral', async () => {
    await electionsRepository.findActiveElectionByCargo(
      'cargo-presidente',
      {
        escopoEleitores: 'FACULDADE',
        faculdadeId: 'faculdade-ciencias',
      },
      'eleicao-actual',
    );

    const query = findFirstMock.mock.calls[0]?.[0];
    expect(query).toBeDefined();
    if (!query) return;
    expect(query.where.cargoId).toBe('cargo-presidente');
    expect(query.where.OR).toEqual([
      { escopoEleitores: 'TODOS' },
      {
        escopoEleitores: 'FACULDADE',
        faculdadeId: 'faculdade-ciencias',
      },
    ]);
  });

  it('considera qualquer eleição do mesmo cargo quando o escopo é geral', async () => {
    await electionsRepository.findActiveElectionByCargo('cargo-presidente', {
      escopoEleitores: 'TODOS',
      faculdadeId: null,
    });

    const query = findFirstMock.mock.calls[0]?.[0];
    expect(query).toBeDefined();
    if (!query) return;
    expect(query.where.cargoId).toBe('cargo-presidente');
    expect(query.where.OR).toBeUndefined();
  });
});
