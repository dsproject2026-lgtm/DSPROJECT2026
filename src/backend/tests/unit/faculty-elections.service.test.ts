import { beforeEach, describe, expect, it, vi } from 'vitest';

const { eligibleVotersRepositoryMock } = vi.hoisted(() => ({
  eligibleVotersRepositoryMock: {
    findElectionById: vi.fn(),
    findUserByCodigo: vi.fn(),
    findByElectionAndUser: vi.fn(),
    create: vi.fn(),
    updateUserFaculty: vi.fn(),
  },
}));

vi.mock('../../src/repositories/eligible-voters.repository.js', () => ({
  eligibleVotersRepository: eligibleVotersRepositoryMock,
}));

vi.mock('../../src/services/auth.service.js', () => ({
  authService: {
    createUser: vi.fn(),
    startFirstAccess: vi.fn(),
  },
}));

import { eligibleVotersService } from '../../src/services/eligible-voters.service.js';

describe('Eleitores de eleições por faculdade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eligibleVotersRepositoryMock.findElectionById.mockResolvedValue({
      id: 'eleicao-1',
      titulo: 'Eleição da Faculdade de Ciências',
      estado: 'PROGRAMADA',
      escopoEleitores: 'FACULDADE',
      faculdadeId: 'faculdade-ciencias',
      faculdade: {
        id: 'faculdade-ciencias',
        nome: 'Faculdade de Ciências',
      },
    });
  });

  it('recusa um utilizador existente que não possui faculdade', async () => {
    eligibleVotersRepositoryMock.findUserByCodigo.mockResolvedValue({
      id: 'utilizador-1',
      codigo: '2026001',
      nome: 'Ana',
      email: 'ana@up.ac.mz',
      faculdadeId: null,
      faculdade: null,
    });

    const result = await eligibleVotersService.importEligibleVoters(
      'eleicao-1',
      'codigo,nome,email,faculdade\n2026001,Ana,ana@up.ac.mz,Faculdade de Ciências',
    );

    expect(result.data.imported).toHaveLength(0);
    expect(result.data.skipped).toContainEqual({
      codigo: '2026001',
      reason: 'USER_WITHOUT_FACULTY',
    });
    expect(eligibleVotersRepositoryMock.updateUserFaculty).not.toHaveBeenCalled();
    expect(eligibleVotersRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('recusa um utilizador pertencente a outra faculdade', async () => {
    eligibleVotersRepositoryMock.findUserByCodigo.mockResolvedValue({
      id: 'utilizador-2',
      codigo: '2026002',
      nome: 'Bento',
      email: 'bento@up.ac.mz',
      faculdadeId: 'faculdade-letras',
      faculdade: {
        id: 'faculdade-letras',
        nome: 'Faculdade de Letras',
      },
    });

    const result = await eligibleVotersService.importEligibleVoters(
      'eleicao-1',
      'codigo,nome,email\n2026002,Bento,bento@up.ac.mz',
    );

    expect(result.data.skipped).toContainEqual({
      codigo: '2026002',
      reason: 'FACULTY_MISMATCH',
    });
    expect(eligibleVotersRepositoryMock.create).not.toHaveBeenCalled();
  });
});
