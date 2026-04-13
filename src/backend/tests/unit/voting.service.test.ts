import { beforeEach, describe, expect, it, vi } from 'vitest';

const { votingRepositoryMock } = vi.hoisted(() => ({
  votingRepositoryMock: {
    findElectionById: vi.fn(),
    findEligibleVoter: vi.fn(),
    findApprovedCandidatesByElection: vi.fn(),
    findCandidateByIdForElection: vi.fn(),
    castVote: vi.fn(),
    findReceiptByElectionAndUser: vi.fn(),
    findAllCandidatesByElection: vi.fn(),
    findVotesByElection: vi.fn(),
    countEligibleVotersByElection: vi.fn(),
  },
}));

vi.mock('../../src/repositories/voting.repository.js', () => ({
  votingRepository: votingRepositoryMock,
}));

import { votingService } from '../../src/services/voting.service.js';

describe('VotingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ballot when election is open and voter is eligible', async () => {
    votingRepositoryMock.findElectionById.mockResolvedValue({
      id: 'election-1',
      titulo: 'Eleição 2026',
      estado: 'VOTACAO_ABERTA',
      dataInicioVotacao: new Date('2026-04-13T10:00:00.000Z'),
      dataFimVotacao: new Date('2026-04-13T18:00:00.000Z'),
    });
    votingRepositoryMock.findEligibleVoter.mockResolvedValue({
      id: 'elig-1',
      eleicaoId: 'election-1',
      utilizadorId: 'user-1',
      jaVotou: false,
    });
    votingRepositoryMock.findApprovedCandidatesByElection.mockResolvedValue([
      {
        id: 'cand-1',
        nome: 'Candidato A',
        fotoUrl: null,
        biografia: null,
        proposta: 'Proposta A',
      },
    ]);

    const result = await votingService.getBallot('election-1', 'user-1');

    expect(result.message).toBe('Boletim de voto carregado com sucesso.');
    expect(result.data.candidates).toHaveLength(1);
  });

  it('casts vote successfully', async () => {
    votingRepositoryMock.findElectionById.mockResolvedValue({
      id: 'election-1',
      titulo: 'Eleição 2026',
      estado: 'VOTACAO_ABERTA',
      dataInicioVotacao: null,
      dataFimVotacao: null,
    });
    votingRepositoryMock.findEligibleVoter.mockResolvedValue({
      id: 'elig-1',
      eleicaoId: 'election-1',
      utilizadorId: 'user-1',
      jaVotou: false,
    });
    votingRepositoryMock.findCandidateByIdForElection.mockResolvedValue({
      id: 'cand-1',
      estado: 'APROVADO',
    });
    votingRepositoryMock.castVote.mockResolvedValue({
      vote: {
        id: 'vote-1',
        candidatoId: 'cand-1',
        dataHora: new Date('2026-04-13T11:00:00.000Z'),
      },
      receipt: {
        codigoVerificacao: 'RCPT-ABC123',
        emitidoEm: new Date('2026-04-13T11:00:00.000Z'),
      },
    });

    const result = await votingService.castVote('election-1', 'user-1', { candidatoId: 'cand-1' });

    expect(result.message).toBe('Voto registado com sucesso.');
    expect(result.data.candidateId).toBe('cand-1');
    expect(result.data.receiptCode).toBe('RCPT-ABC123');
  });

  it('throws when voter already voted', async () => {
    votingRepositoryMock.findElectionById.mockResolvedValue({
      id: 'election-1',
      titulo: 'Eleição 2026',
      estado: 'VOTACAO_ABERTA',
      dataInicioVotacao: null,
      dataFimVotacao: null,
    });
    votingRepositoryMock.findEligibleVoter.mockResolvedValue({
      id: 'elig-1',
      eleicaoId: 'election-1',
      utilizadorId: 'user-1',
      jaVotou: true,
    });

    await expect(
      votingService.castVote('election-1', 'user-1', { candidatoId: 'cand-1' }),
    ).rejects.toThrow('Este utilizador já votou nesta eleição.');
  });

  it('returns vote status for current user', async () => {
    votingRepositoryMock.findElectionById.mockResolvedValue({
      id: 'election-1',
      titulo: 'Eleição 2026',
      estado: 'VOTACAO_ABERTA',
      dataInicioVotacao: null,
      dataFimVotacao: null,
    });
    votingRepositoryMock.findEligibleVoter.mockResolvedValue({
      id: 'elig-1',
      eleicaoId: 'election-1',
      utilizadorId: 'user-1',
      jaVotou: true,
    });
    votingRepositoryMock.findReceiptByElectionAndUser.mockResolvedValue({
      codigoVerificacao: 'RCPT-ABC123',
      emitidoEm: new Date('2026-04-13T11:00:00.000Z'),
    });

    const result = await votingService.getMyVoteStatus('election-1', 'user-1');

    expect(result.message).toBe('Estado de voto carregado com sucesso.');
    expect(result.data.hasVoted).toBe(true);
    expect(result.data.receiptCode).toBe('RCPT-ABC123');
  });

  it('returns election results when election is closed', async () => {
    votingRepositoryMock.findElectionById.mockResolvedValue({
      id: 'election-1',
      titulo: 'Eleição 2026',
      estado: 'VOTACAO_ENCERRADA',
      dataInicioVotacao: null,
      dataFimVotacao: null,
    });
    votingRepositoryMock.findAllCandidatesByElection.mockResolvedValue([
      { id: 'cand-1', nome: 'Candidato A', estado: 'APROVADO' },
      { id: 'cand-2', nome: 'Candidato B', estado: 'APROVADO' },
    ]);
    votingRepositoryMock.findVotesByElection.mockResolvedValue([
      { candidatoId: 'cand-1' },
      { candidatoId: 'cand-1' },
      { candidatoId: 'cand-2' },
    ]);
    votingRepositoryMock.countEligibleVotersByElection.mockResolvedValue(5);

    const result = await votingService.getElectionResults('election-1');

    expect(result.message).toBe('Resultados da eleição carregados com sucesso.');
    expect(result.data.summary.totalVotes).toBe(3);
    expect(result.data.summary.totalEligibleVoters).toBe(5);
    expect(result.data.winner?.candidateId).toBe('cand-1');
  });

  it('throws when results are requested before voting closes', async () => {
    votingRepositoryMock.findElectionById.mockResolvedValue({
      id: 'election-1',
      titulo: 'Eleição 2026',
      estado: 'VOTACAO_ABERTA',
      dataInicioVotacao: null,
      dataFimVotacao: null,
    });

    await expect(votingService.getElectionResults('election-1')).rejects.toThrow(
      'Os resultados desta eleição ainda não estão disponíveis.',
    );
  });
});