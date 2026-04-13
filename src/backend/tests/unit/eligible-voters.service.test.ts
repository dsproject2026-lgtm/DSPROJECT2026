import { beforeEach, describe, expect, it, vi } from 'vitest';

const { eligibleVotersRepositoryMock } = vi.hoisted(() => ({
    eligibleVotersRepositoryMock: {
        findElectionById: vi.fn(),
        findAllByElection: vi.fn(),
        findUserByCodigo: vi.fn(),
        findByElectionAndUser: vi.fn(),
        create: vi.fn(),
    },
}));

vi.mock('../../src/repositories/eligible-voters.repository.js', () => ({
    eligibleVotersRepository: eligibleVotersRepositoryMock,
}));

import { eligibleVotersService } from '../../src/services/eligible-voters.service.js';

describe('EligibleVotersService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listEligibleVoters', () => {
        it('returns eligible voters list when election exists', async () => {
            eligibleVotersRepositoryMock.findElectionById.mockResolvedValue({
                id: 'eleicao-1',
                titulo: 'Eleição 2026',
                estado: 'CANDIDATURAS_ABERTAS',
            });

            eligibleVotersRepositoryMock.findAllByElection.mockResolvedValue([
                {
                    id: 'eleg-1',
                    eleicaoId: 'eleicao-1',
                    utilizadorId: 'user-1',
                    jaVotou: false,
                    importadoEm: new Date('2026-04-13T10:00:00.000Z'),
                    eleicao: {
                        id: 'eleicao-1',
                        cargoId: 'cargo-1',
                        titulo: 'Eleição 2026',
                        estado: 'CANDIDATURAS_ABERTAS',
                    },
                    utilizador: {
                        id: 'user-1',
                        codigo: '2026001',
                        nome: 'Ana Silva',
                        email: 'ana@example.com',
                        perfil: 'ELEITOR',
                        activo: true,
                        mustSetPassword: false,
                        createdAt: new Date('2026-04-13T09:00:00.000Z'),
                    },
                },
            ]);

            const result = await eligibleVotersService.listEligibleVoters('eleicao-1');

            expect(result.message).toBe('Eleitores elegíveis listados com sucesso.');
            expect(result.data).toHaveLength(1);
            expect(result.count).toBe(1);
        });

        it('throws when election is missing', async () => {
            eligibleVotersRepositoryMock.findElectionById.mockResolvedValue(null);

            await expect(eligibleVotersService.listEligibleVoters('invalid')).rejects.toThrow(
                'Eleição não encontrada.',
            );
        });
    });

    describe('importEligibleVoters', () => {
        it('imports eligible voters and reports skipped rows', async () => {
            eligibleVotersRepositoryMock.findElectionById.mockResolvedValue({
                id: 'eleicao-1',
                titulo: 'Eleição 2026',
                estado: 'CANDIDATURAS_ABERTAS',
            });

            eligibleVotersRepositoryMock.findUserByCodigo
                .mockResolvedValueOnce({
                    id: 'user-1',
                    codigo: '2026001',
                    nome: 'Ana Silva',
                    email: 'ana@example.com',
                    perfil: 'ELEITOR',
                    activo: true,
                    mustSetPassword: false,
                    createdAt: new Date('2026-04-13T09:00:00.000Z'),
                })
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 'user-1',
                    codigo: '2026001',
                    nome: 'Ana Silva',
                    email: 'ana@example.com',
                    perfil: 'ELEITOR',
                    activo: true,
                    mustSetPassword: false,
                    createdAt: new Date('2026-04-13T09:00:00.000Z'),
                });

            eligibleVotersRepositoryMock.findByElectionAndUser
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'eleg-existing' });

            eligibleVotersRepositoryMock.create.mockResolvedValue({
                id: 'eleg-1',
                eleicaoId: 'eleicao-1',
                utilizadorId: 'user-1',
                jaVotou: false,
                importadoEm: new Date('2026-04-13T10:00:00.000Z'),
                eleicao: {
                    id: 'eleicao-1',
                    cargoId: 'cargo-1',
                    titulo: 'Eleição 2026',
                    estado: 'CANDIDATURAS_ABERTAS',
                },
                utilizador: {
                    id: 'user-1',
                    codigo: '2026001',
                    nome: 'Ana Silva',
                    email: 'ana@example.com',
                    perfil: 'ELEITOR',
                    activo: true,
                    mustSetPassword: false,
                    createdAt: new Date('2026-04-13T09:00:00.000Z'),
                },
            });

            const result = await eligibleVotersService.importEligibleVoters(
                'eleicao-1',
                'codigo\n2026001\n2026009\n2026001',
            );

            expect(result.message).toBe('Eleitores elegíveis importados com sucesso.');
            expect(result.data.count).toBe(1);
            expect(result.data.totalCount).toBe(3);
            expect(result.data.imported).toHaveLength(1);
            expect(result.data.skipped).toHaveLength(2);
            expect(result.data.skipped).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ codigo: '2026009', reason: 'USER_NOT_FOUND' }),
                    expect.objectContaining({ codigo: '2026001', reason: 'ALREADY_REGISTERED' }),
                ]),
            );
        });

        it('throws when CSV has no valid codes', async () => {
            eligibleVotersRepositoryMock.findElectionById.mockResolvedValue({
                id: 'eleicao-1',
                titulo: 'Eleição 2026',
                estado: 'CANDIDATURAS_ABERTAS',
            });

            await expect(eligibleVotersService.importEligibleVoters('eleicao-1', '   ')).rejects.toThrow(
                'O ficheiro CSV não contém códigos válidos.',
            );
        });
    });
});