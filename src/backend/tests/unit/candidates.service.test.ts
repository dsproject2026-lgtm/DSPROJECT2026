import { beforeEach, describe, expect, it, vi } from 'vitest';

const { candidatesRepositoryMock } = vi.hoisted(() => ({
    candidatesRepositoryMock: {
        create: vi.fn(),
        findById: vi.fn(),
        findByIdForElection: vi.fn(),
        findAllByElection: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findElectionById: vi.fn(),
        findUserById: vi.fn(),
        promoteUserToCandidate: vi.fn(),
        findByElectionAndUser: vi.fn(),
    },
}));

vi.mock('../../src/repositories/candidates.repository.js', () => ({
    candidatesRepository: candidatesRepositoryMock,
}));

import { candidatesService } from '../../src/services/candidates.service.js';

describe('CandidatesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createCandidate', () => {
        it('creates candidate successfully', async () => {
            const electionId = 'election-1';
            const inputData = {
                utilizadorId: 'user-1',
                nome: 'Candidate One',
            };

            candidatesRepositoryMock.findElectionById.mockResolvedValue({
                id: electionId,
                estado: 'ABERTA',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-1',
                perfil: 'CANDIDATO',
                activo: true,
            });
            candidatesRepositoryMock.findByElectionAndUser.mockResolvedValue(null);
            candidatesRepositoryMock.create.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: electionId,
                utilizadorId: 'user-1',
                nome: 'Candidate One',
                estado: 'APROVADO',
            });

            const result = await candidatesService.createCandidate(electionId, inputData, 'admin-1');

            expect(result.message).toBe('Candidato registado com sucesso.');
            expect(result.data.id).toBe('candidate-1');
            expect(candidatesRepositoryMock.create).toHaveBeenCalledWith(
                electionId,
                {
                    ...inputData,
                    estado: 'APROVADO',
                },
                'admin-1',
            );
        });

        it('throws when election does not exist', async () => {
            candidatesRepositoryMock.findElectionById.mockResolvedValue(null);

            await expect(
                candidatesService.createCandidate('missing-election', {
                    utilizadorId: 'user-1',
                    nome: 'Candidate One',
                }),
            ).rejects.toThrow('Eleição não encontrada.');
        });

        it('promotes elector and creates candidate successfully', async () => {
            candidatesRepositoryMock.findElectionById.mockResolvedValue({
                id: 'election-1',
                estado: 'ABERTA',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-1',
                perfil: 'ELEITOR',
                activo: true,
            });
            candidatesRepositoryMock.findByElectionAndUser.mockResolvedValue(null);
            candidatesRepositoryMock.promoteUserToCandidate.mockResolvedValue({
                id: 'user-1',
                perfil: 'CANDIDATO',
                activo: true,
            });
            candidatesRepositoryMock.create.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
                nome: 'Candidate One',
                estado: 'APROVADO',
            });

            const result = await candidatesService.createCandidate('election-1', {
                utilizadorId: 'user-1',
                nome: 'Candidate One',
            });

            expect(result.data.id).toBe('candidate-1');
            expect(candidatesRepositoryMock.promoteUserToCandidate).toHaveBeenCalledWith('user-1');
            expect(candidatesRepositoryMock.create).toHaveBeenCalled();
        });

        it('throws when user cannot be promoted to CANDIDATO profile', async () => {
            candidatesRepositoryMock.findElectionById.mockResolvedValue({
                id: 'election-1',
                estado: 'ABERTA',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-1',
                perfil: 'ADMIN',
                activo: true,
            });

            await expect(
                candidatesService.createCandidate('election-1', {
                    utilizadorId: 'user-1',
                    nome: 'Candidate One',
                }),
            ).rejects.toThrow('Apenas eleitores podem ser promovidos a candidatos.');
            expect(candidatesRepositoryMock.findByElectionAndUser).not.toHaveBeenCalled();
            expect(candidatesRepositoryMock.create).not.toHaveBeenCalled();
        });

        it('throws when user already registered in election', async () => {
            candidatesRepositoryMock.findElectionById.mockResolvedValue({
                id: 'election-1',
                estado: 'ABERTA',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-1',
                perfil: 'CANDIDATO',
                activo: true,
            });
            candidatesRepositoryMock.findByElectionAndUser.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
            });

            await expect(
                candidatesService.createCandidate('election-1', {
                    utilizadorId: 'user-1',
                    nome: 'Candidate One',
                }),
            ).rejects.toThrow('Este utilizador já está registado como candidato nesta eleição.');
        });
    });

    describe('getCandidateById', () => {
        it('returns candidate when found without registrar details', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
                registadoPor: 'gestor-1',
                nome: 'Candidate One',
                estado: 'PENDENTE',
                registador: { id: 'gestor-1' },
            });

            const result = await candidatesService.getCandidateById('election-1', 'candidate-1');

            expect(result.message).toBe('Candidato encontrado com sucesso.');
            expect(result.data.id).toBe('candidate-1');
            expect(result.data).not.toHaveProperty('registadoPor');
            expect(result.data).not.toHaveProperty('registador');
        });

        it('throws when candidate not found', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue(null);

            await expect(
                candidatesService.getCandidateById('election-1', 'missing-candidate'),
            ).rejects.toThrow('Candidato não encontrado.');
        });
    });

    describe('listCandidates', () => {
        it('returns candidates for election without registrar details', async () => {
            candidatesRepositoryMock.findElectionById.mockResolvedValue({
                id: 'election-1',
                estado: 'CANDIDATURAS_ABERTAS',
            });
            candidatesRepositoryMock.findAllByElection.mockResolvedValue([
                {
                    id: 'candidate-1',
                    eleicaoId: 'election-1',
                    utilizadorId: 'user-1',
                    registadoPor: 'gestor-1',
                    nome: 'Candidate One',
                    estado: 'PENDENTE',
                    registador: { id: 'gestor-1' },
                },
            ]);

            const result = await candidatesService.listCandidates('election-1', { estado: 'PENDENTE' });

            expect(result.message).toBe('Candidatos listados com sucesso.');
            expect(result.count).toBe(1);
            expect(result.data[0]).not.toHaveProperty('registadoPor');
            expect(result.data[0]).not.toHaveProperty('registador');
            expect(candidatesRepositoryMock.findAllByElection).toHaveBeenCalledWith('election-1', {
                estado: 'PENDENTE',
            });
        });
    });

    describe('updateCandidate', () => {
        it('updates candidate successfully', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
                nome: 'Candidate One',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-2',
                perfil: 'CANDIDATO',
                activo: true,
            });
            candidatesRepositoryMock.findByElectionAndUser.mockResolvedValue(null);
            candidatesRepositoryMock.update.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-2',
                nome: 'Candidate Updated',
                estado: 'APROVADO',
            });

            const result = await candidatesService.updateCandidate('election-1', 'candidate-1', {
                utilizadorId: 'user-2',
                nome: 'Candidate Updated',
                estado: 'APROVADO',
            });

            expect(result.message).toBe('Candidato atualizado com sucesso.');
            expect(result.data.utilizadorId).toBe('user-2');
        });

        it('throws when update target candidate does not exist', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue(null);

            await expect(
                candidatesService.updateCandidate('election-1', 'missing-candidate', { nome: 'New' }),
            ).rejects.toThrow('Candidato não encontrado.');
        });

        it('promotes elector when updating candidate user', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
                nome: 'Candidate One',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-2',
                perfil: 'ELEITOR',
                activo: true,
            });
            candidatesRepositoryMock.findByElectionAndUser.mockResolvedValue(null);
            candidatesRepositoryMock.update.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-2',
                nome: 'Candidate One',
            });

            const result = await candidatesService.updateCandidate('election-1', 'candidate-1', {
                utilizadorId: 'user-2',
            });

            expect(result.data.utilizadorId).toBe('user-2');
            expect(candidatesRepositoryMock.promoteUserToCandidate).toHaveBeenCalledWith('user-2');
        });

        it('throws when updating to a user that cannot be promoted', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
                nome: 'Candidate One',
            });
            candidatesRepositoryMock.findUserById.mockResolvedValue({
                id: 'user-2',
                perfil: 'ADMIN',
                activo: true,
            });

            await expect(
                candidatesService.updateCandidate('election-1', 'candidate-1', {
                    utilizadorId: 'user-2',
                }),
            ).rejects.toThrow('Apenas eleitores podem ser promovidos a candidatos.');
            expect(candidatesRepositoryMock.findByElectionAndUser).not.toHaveBeenCalled();
            expect(candidatesRepositoryMock.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteCandidate', () => {
        it('deletes candidate successfully', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
            });
            candidatesRepositoryMock.delete.mockResolvedValue({
                id: 'candidate-1',
            });

            const result = await candidatesService.deleteCandidate('election-1', 'candidate-1');

            expect(result.message).toBe('Candidato eliminado com sucesso.');
            expect(result.data).toEqual({ id: 'candidate-1', deleted: true });
        });

        it('throws when candidate does not exist for deletion', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue(null);

            await expect(
                candidatesService.deleteCandidate('election-1', 'missing-candidate'),
            ).rejects.toThrow('Candidato não encontrado.');
        });
    });

    describe('candidate status actions', () => {
        it('approves candidate with APROVADO status', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
            });
            candidatesRepositoryMock.update.mockResolvedValue({
                id: 'candidate-1',
                estado: 'APROVADO',
            });

            const result = await candidatesService.approveCandidate('election-1', 'candidate-1');

            expect(result.message).toBe('Candidato aprovado com sucesso.');
            expect(candidatesRepositoryMock.update).toHaveBeenCalledWith('candidate-1', {
                estado: 'APROVADO',
            });
        });

        it('rejects candidate with REJEITADO status', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
            });
            candidatesRepositoryMock.update.mockResolvedValue({
                id: 'candidate-1',
                estado: 'REJEITADO',
            });

            const result = await candidatesService.rejectCandidate('election-1', 'candidate-1');

            expect(result.message).toBe('Candidato rejeitado com sucesso.');
            expect(candidatesRepositoryMock.update).toHaveBeenCalledWith('candidate-1', {
                estado: 'REJEITADO',
            });
        });

        it('suspends candidate with SUSPENSO status', async () => {
            candidatesRepositoryMock.findByIdForElection.mockResolvedValue({
                id: 'candidate-1',
                eleicaoId: 'election-1',
                utilizadorId: 'user-1',
            });
            candidatesRepositoryMock.update.mockResolvedValue({
                id: 'candidate-1',
                estado: 'SUSPENSO',
            });

            const result = await candidatesService.suspendCandidate('election-1', 'candidate-1');

            expect(result.message).toBe('Candidato suspenso com sucesso.');
            expect(candidatesRepositoryMock.update).toHaveBeenCalledWith('candidate-1', {
                estado: 'SUSPENSO',
            });
        });
    });
});
