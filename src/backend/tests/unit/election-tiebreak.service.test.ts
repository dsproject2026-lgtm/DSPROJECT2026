import { beforeEach, describe, expect, it, vi } from 'vitest';

const { electionsRepositoryMock, votingRepositoryMock } = vi.hoisted(() => ({
  electionsRepositoryMock: {
    findById: vi.fn(),
    findActiveElectionByCargo: vi.fn(),
    reopenForTie: vi.fn(),
  },
  votingRepositoryMock: {
    findAllCandidatesByElection: vi.fn(),
    findVotesByElection: vi.fn(),
    countEligibleVotersByElection: vi.fn(),
  },
}));

vi.mock('../../src/repositories/elections.repository.js', () => ({
  electionsRepository: electionsRepositoryMock,
}));

vi.mock('../../src/repositories/voting.repository.js', () => ({
  votingRepository: votingRepositoryMock,
}));

vi.mock('../../src/services/settings.service.js', () => ({
  settingsService: {
    getSystemSettings: vi.fn().mockResolvedValue({
      settings: { autoCloseElection: true, allowImmediateResults: false },
    }),
  },
}));

import { electionsService } from '../../src/services/elections.service.js';

describe('Reabertura de eleição para desempate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    electionsRepositoryMock.findById.mockResolvedValue({
      id: 'eleicao-1',
      cargoId: 'cargo-1',
      estado: 'CONCLUIDA',
      numeroRodada: 1,
    });
    votingRepositoryMock.findAllCandidatesByElection.mockResolvedValue([
      { id: 'candidato-1', nome: 'Ana', estado: 'APROVADO' },
      { id: 'candidato-2', nome: 'Bento', estado: 'APROVADO' },
      { id: 'candidato-3', nome: 'Carla', estado: 'APROVADO' },
    ]);
    electionsRepositoryMock.reopenForTie.mockResolvedValue({
      id: 'eleicao-1',
      estado: 'PROGRAMADA',
      emDesempate: true,
      numeroRodada: 2,
    });
    electionsRepositoryMock.findActiveElectionByCargo.mockResolvedValue(null);
  });

  it('liberta todos os eleitores quando a participação anterior foi de 100%', async () => {
    votingRepositoryMock.findVotesByElection.mockResolvedValue([
      { candidatoId: 'candidato-1' },
      { candidatoId: 'candidato-1' },
      { candidatoId: 'candidato-2' },
      { candidatoId: 'candidato-2' },
    ]);
    votingRepositoryMock.countEligibleVotersByElection.mockResolvedValue(4);

    const result = await electionsService.reopenElectionForTie('eleicao-1', {
      dataInicioVotacao: '2099-06-21T08:00:00.000Z',
      dataFimVotacao: '2099-06-21T18:00:00.000Z',
    });

    expect(electionsRepositoryMock.reopenForTie).toHaveBeenCalledWith(
      expect.objectContaining({
        tiedCandidateIds: ['candidato-1', 'candidato-2'],
        resetAllVoters: true,
      }),
    );
    expect(result.data.votersReset).toBe(true);
  });

  it('mantém quem já votou quando a participação anterior foi inferior a 100%', async () => {
    votingRepositoryMock.findVotesByElection.mockResolvedValue([
      { candidatoId: 'candidato-1' },
      { candidatoId: 'candidato-2' },
    ]);
    votingRepositoryMock.countEligibleVotersByElection.mockResolvedValue(4);

    const result = await electionsService.reopenElectionForTie('eleicao-1', {
      dataInicioVotacao: '2099-06-21T08:00:00.000Z',
      dataFimVotacao: '2099-06-21T18:00:00.000Z',
    });

    expect(electionsRepositoryMock.reopenForTie).toHaveBeenCalledWith(
      expect.objectContaining({
        tiedCandidateIds: ['candidato-1', 'candidato-2'],
        resetAllVoters: false,
      }),
    );
    expect(result.data.previousTurnoutPercentage).toBe(50);
    expect(result.data.votersReset).toBe(false);
  });

  it('recusa a reabertura quando não existe empate no primeiro lugar', async () => {
    votingRepositoryMock.findVotesByElection.mockResolvedValue([
      { candidatoId: 'candidato-1' },
      { candidatoId: 'candidato-1' },
      { candidatoId: 'candidato-2' },
    ]);
    votingRepositoryMock.countEligibleVotersByElection.mockResolvedValue(4);

    await expect(
      electionsService.reopenElectionForTie('eleicao-1', {
        dataInicioVotacao: '2099-06-21T08:00:00.000Z',
        dataFimVotacao: '2099-06-21T18:00:00.000Z',
      }),
    ).rejects.toThrow('A eleição não possui empate no primeiro lugar.');
  });
});
