import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { votingServiceMock } = vi.hoisted(() => ({
  votingServiceMock: {
    getBallot: vi.fn(),
    castVote: vi.fn(),
    getMyVoteStatus: vi.fn(),
    getElectionResults: vi.fn(),
  },
}));

vi.mock('../../src/services/voting.service.js', () => ({
  votingService: votingServiceMock,
}));

import { createApp } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/auth-token.js';

const app = createApp();

describe('voting routes integration', () => {
  const electionId = '11111111-1111-4111-8111-111111111111';
  const accessToken = generateAccessToken({
    sub: 'user-1',
    codigo: '2026001',
    perfil: 'ELEITOR',
    purpose: 'ACCESS',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /ballot returns 200 for authenticated user', async () => {
    votingServiceMock.getBallot.mockResolvedValue({
      message: 'Boletim de voto carregado com sucesso.',
      data: {
        election: {
          id: electionId,
          titulo: 'Eleição 2026',
          estado: 'VOTACAO_ABERTA',
          dataInicioVotacao: null,
          dataFimVotacao: null,
        },
        candidates: [],
      },
    });

    const response = await request(app)
      .get(`/api/v1/elections/${electionId}/ballot`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('POST /votes returns 201 for valid vote payload', async () => {
    votingServiceMock.castVote.mockResolvedValue({
      message: 'Voto registado com sucesso.',
      data: {
        receiptCode: 'RCPT-ABC123',
        votedAt: '2026-04-13T11:00:00.000Z',
        electionId,
        candidateId: '22222222-2222-4222-8222-222222222222',
      },
    });

    const response = await request(app)
      .post(`/api/v1/elections/${electionId}/votes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        candidatoId: '22222222-2222-4222-8222-222222222222',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.receiptCode).toBe('RCPT-ABC123');
  });

  it('GET /votes/me/status returns 200 with vote status', async () => {
    votingServiceMock.getMyVoteStatus.mockResolvedValue({
      message: 'Estado de voto carregado com sucesso.',
      data: {
        electionId,
        hasVoted: true,
        votedAt: '2026-04-13T11:00:00.000Z',
        receiptCode: 'RCPT-ABC123',
      },
    });

    const response = await request(app)
      .get(`/api/v1/elections/${electionId}/votes/me/status`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.hasVoted).toBe(true);
  });

  it('returns 401 when request is unauthenticated', async () => {
    const response = await request(app).get(`/api/v1/elections/${electionId}/ballot`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_TOKEN_REQUIRED');
  });

  it('GET /results returns 200 for authenticated user', async () => {
    votingServiceMock.getElectionResults.mockResolvedValue({
      message: 'Resultados da eleição carregados com sucesso.',
      data: {
        election: {
          id: electionId,
          titulo: 'Eleição 2026',
          estado: 'VOTACAO_ENCERRADA',
        },
        summary: {
          totalEligibleVoters: 10,
          totalVotes: 8,
          turnoutPercentage: 80,
        },
        candidates: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            nome: 'Candidato A',
            estado: 'APROVADO',
            votes: 5,
            percentage: 62.5,
          },
        ],
        winner: {
          candidateId: '22222222-2222-4222-8222-222222222222',
          nome: 'Candidato A',
          votes: 5,
        },
      },
    });

    const response = await request(app)
      .get(`/api/v1/elections/${electionId}/results`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.totalVotes).toBe(8);
  });
});