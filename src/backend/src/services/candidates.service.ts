import { candidatesRepository } from '../repositories/candidates.repository.js';
import type {
    CandidateResponse,
    CreateCandidateApiInput,
    ListCandidatesFilters,
    UpdateCandidateApiInput,
} from '../types/candidates.types.js';
import type { EstadoCandidato } from '../types/model.types.js';
import { AppError } from '../utils/app-error.js';

class CandidatesService {
    async createCandidate(electionId: string, data: CreateCandidateApiInput, registadoPor?: string) {
        const utilizadorId = data.utilizadorId;

        const election = await candidatesRepository.findElectionById(electionId);

        if (!election) {
            throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
        }

        const user = await candidatesRepository.findUserById(utilizadorId);

        if (!user) {
            throw new AppError('Utilizador não encontrado.', 404, 'USER_NOT_FOUND', {
                utilizadorId,
            });
        }

        if (user.perfil !== 'CANDIDATO') {
            throw new AppError(
                'Apenas utilizadores com perfil CANDIDATO podem ser registados como candidatos.',
                400,
                'CANDIDATE_PROFILE_INVALID',
                { utilizadorId },
            );
        }

        const existingCandidate = await candidatesRepository.findByElectionAndUser(
            electionId,
            utilizadorId,
        );

        if (existingCandidate) {
            throw new AppError(
                'Este utilizador já está registado como candidato nesta eleição.',
                409,
                'CANDIDATE_ALREADY_REGISTERED',
                {
                    electionId,
                    utilizadorId,
                },
            );
        }

        const candidate = await candidatesRepository.create(
            electionId,
            {
                ...data,
                utilizadorId,
                estado: 'APROVADO',
            },
            registadoPor,
        );

        return {
            message: 'Candidato registado com sucesso.',
            data: candidate,
        };
    }

    async getCandidateById(electionId: string, id: string) {
        const candidate = await candidatesRepository.findByIdForElection(id, electionId);

        if (!candidate) {
            throw new AppError('Candidato não encontrado.', 404, 'CANDIDATE_NOT_FOUND', {
                id,
                electionId,
            });
        }

        const publicCandidate = this.toPublicCandidate(candidate);

        return {
            message: 'Candidato encontrado com sucesso.',
            data: publicCandidate,
        };
    }

    async listCandidates(electionId: string, filters?: ListCandidatesFilters) {
        const election = await candidatesRepository.findElectionById(electionId);

        if (!election) {
            throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
        }

        const candidates = await candidatesRepository.findAllByElection(electionId, filters);
        const publicCandidates = candidates.map((candidate) => this.toPublicCandidate(candidate));

        return {
            message: 'Candidatos listados com sucesso.',
            data: publicCandidates,
            count: publicCandidates.length,
        };
    }

    async updateCandidate(electionId: string, id: string, partialData: UpdateCandidateApiInput) {
        const existingCandidate = await candidatesRepository.findByIdForElection(id, electionId);

        if (!existingCandidate) {
            throw new AppError('Candidato não encontrado.', 404, 'CANDIDATE_NOT_FOUND', {
                id,
                electionId,
            });
        }

        if (partialData.utilizadorId !== undefined) {
            const user = await candidatesRepository.findUserById(partialData.utilizadorId);

            if (!user) {
                throw new AppError('Utilizador não encontrado.', 404, 'USER_NOT_FOUND', {
                    utilizadorId: partialData.utilizadorId,
                });
            }

            if (partialData.utilizadorId !== existingCandidate.utilizadorId) {
                const existingForUser = await candidatesRepository.findByElectionAndUser(
                    electionId,
                    partialData.utilizadorId,
                );

                if (existingForUser) {
                    throw new AppError(
                        'Este utilizador já está registado como candidato nesta eleição.',
                        409,
                        'CANDIDATE_ALREADY_REGISTERED',
                        {
                            electionId,
                            utilizadorId: partialData.utilizadorId,
                        },
                    );
                }
            }
        }

        const updatedCandidate = await candidatesRepository.update(id, partialData);

        return {
            message: 'Candidato atualizado com sucesso.',
            data: updatedCandidate,
        };
    }

    async deleteCandidate(electionId: string, id: string) {
        const existingCandidate = await candidatesRepository.findByIdForElection(id, electionId);

        if (!existingCandidate) {
            throw new AppError('Candidato não encontrado.', 404, 'CANDIDATE_NOT_FOUND', {
                id,
                electionId,
            });
        }

        await candidatesRepository.delete(id);

        return {
            message: 'Candidato eliminado com sucesso.',
            data: { id, deleted: true },
        };
    }

    async approveCandidate(electionId: string, id: string) {
        return this.updateCandidateStatus(electionId, id, 'APROVADO', 'Candidato aprovado com sucesso.');
    }

    async rejectCandidate(electionId: string, id: string) {
        return this.updateCandidateStatus(electionId, id, 'REJEITADO', 'Candidato rejeitado com sucesso.');
    }

    async suspendCandidate(electionId: string, id: string) {
        return this.updateCandidateStatus(electionId, id, 'SUSPENSO', 'Candidato suspenso com sucesso.');
    }

    private async updateCandidateStatus(
        electionId: string,
        id: string,
        estado: EstadoCandidato,
        message: string,
    ) {
        const existingCandidate = await candidatesRepository.findByIdForElection(id, electionId);

        if (!existingCandidate) {
            throw new AppError('Candidato não encontrado.', 404, 'CANDIDATE_NOT_FOUND', {
                id,
                electionId,
            });
        }

        const updatedCandidate = await candidatesRepository.update(id, { estado });

        return {
            message,
            data: updatedCandidate,
        };
    }

    private toPublicCandidate(candidate: {
        registadoPor: string | null;
        registador: unknown;
    } & Record<string, unknown>): CandidateResponse {
        const { registadoPor: _registadoPor, registador: _registador, ...publicCandidate } = candidate;
        return publicCandidate as CandidateResponse;
    }
}

export const candidatesService = new CandidatesService();
