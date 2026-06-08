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
            throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
        }

        if (election.estado !== 'PROGRAMADA') {
            throw new AppError(
                'Candidatos so podem ser associados quando a eleicao esta programada.',
                409,
                'CANDIDATE_ELECTION_NOT_PROGRAMMED',
                { electionId, estado: election.estado },
            );
        }

        const user = await candidatesRepository.findUserById(utilizadorId);

        if (!user) {
            throw new AppError('Utilizador nao encontrado.', 404, 'USER_NOT_FOUND', { utilizadorId });
        }

        if (!user.activo) {
            throw new AppError('A conta do utilizador esta inativa.', 403, 'USER_ACCOUNT_INACTIVE', {
                utilizadorId,
            });
        }

        if (user.perfil !== 'ELEITOR' && user.perfil !== 'CANDIDATO') {
            throw new AppError(
                'Apenas eleitores podem ser promovidos a candidatos.',
                400,
                'CANDIDATE_PROFILE_INVALID',
                { utilizadorId },
            );
        }

        const eligibleVoter = await candidatesRepository.findEligibleVoter(electionId, utilizadorId);
        if (!eligibleVoter) {
            throw new AppError(
                'O candidato deve estar registado como eleitor elegivel nesta eleicao.',
                400,
                'CANDIDATE_MUST_BE_ELIGIBLE_VOTER',
                { electionId, utilizadorId },
            );
        }

        const existingCandidate = await candidatesRepository.findByElectionAndUser(electionId, utilizadorId);

        if (existingCandidate) {
            throw new AppError(
                'Este utilizador ja esta registado como candidato nesta eleicao.',
                409,
                'CANDIDATE_ALREADY_REGISTERED',
                { electionId, utilizadorId },
            );
        }

        if (user.perfil === 'ELEITOR') {
            await candidatesRepository.promoteUserToCandidate(utilizadorId);
        }

        const candidate = await candidatesRepository.create(
            electionId,
            {
                ...data,
                nome: data.nome?.trim() || user.nome,
                fotoUrl: null,
                biografia: null,
                proposta: null,
                estado: 'APROVADO',
            },
            registadoPor,
        );

        return {
            message: 'Candidato associado com sucesso.',
            data: candidate,
        };
    }

    async getCandidateById(electionId: string, id: string) {
        const candidate = await candidatesRepository.findByIdForElection(id, electionId);

        if (!candidate) {
            throw new AppError('Candidato nao encontrado.', 404, 'CANDIDATE_NOT_FOUND', { id, electionId });
        }

        return {
            message: 'Candidato encontrado com sucesso.',
            data: this.toPublicCandidate(candidate),
        };
    }

    async listCandidates(electionId: string, filters?: ListCandidatesFilters) {
        const election = await candidatesRepository.findElectionById(electionId);

        if (!election) {
            throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
        }

        const candidates = await candidatesRepository.findAllByElection(electionId, filters);
        const publicCandidates = candidates.map((candidate) => this.toPublicCandidate(candidate));

        return {
            message: 'Candidatos listados com sucesso.',
            data: publicCandidates,
            count: publicCandidates.length,
        };
    }

    async listMyCandidacies(userId: string) {
        const candidates = await candidatesRepository.findCandidateByUser(userId);

        return {
            message: 'Candidaturas do candidato listadas com sucesso.',
            data: candidates.map((candidate) => this.toPublicCandidate(candidate)),
            count: candidates.length,
        };
    }

    async updateCandidate(electionId: string, id: string, partialData: UpdateCandidateApiInput, actorUserId?: string) {
        const existingCandidate = await candidatesRepository.findByIdForElection(id, electionId);

        if (!existingCandidate) {
            throw new AppError('Candidato nao encontrado.', 404, 'CANDIDATE_NOT_FOUND', { id, electionId });
        }

        const isSelfUpdate = actorUserId === existingCandidate.utilizadorId;
        if (existingCandidate.eleicao.estado === 'ABERTA' && !isSelfUpdate) {
            throw new AppError(
                'Eleicoes abertas nao permitem gerir candidatos pela comissao.',
                409,
                'ELECTION_OPEN_READ_ONLY',
                { electionId },
            );
        }

        if (isSelfUpdate) {
            const allowedKeys = new Set(['fotoUrl', 'biografia', 'proposta']);
            const hasForbiddenKey = Object.keys(partialData).some((key) => !allowedKeys.has(key));
            if (hasForbiddenKey) {
                throw new AppError(
                    'O candidato so pode atualizar foto, biografia e proposta. O nome completo vem do registo oficial.',
                    403,
                    'CANDIDATE_SELF_UPDATE_FORBIDDEN_FIELD',
                );
            }

            if (!this.isCandidacyWindowOpen(existingCandidate.eleicao)) {
                throw new AppError(
                    'A edicao da candidatura esta bloqueada fora do periodo de candidatura.',
                    409,
                    'CANDIDATE_SELF_UPDATE_CLOSED',
                    { electionId },
                );
            }
        }

        if (partialData.utilizadorId !== undefined) {
            throw new AppError(
                'Nao e permitido trocar o utilizador de uma candidatura existente.',
                400,
                'CANDIDATE_USER_CHANGE_NOT_ALLOWED',
            );
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
            throw new AppError('Candidato nao encontrado.', 404, 'CANDIDATE_NOT_FOUND', { id, electionId });
        }

        if (existingCandidate.eleicao.estado !== 'PROGRAMADA') {
            throw new AppError(
                'Candidatos so podem ser removidos quando a eleicao esta programada.',
                409,
                'CANDIDATE_ELECTION_NOT_PROGRAMMED',
                { electionId, estado: existingCandidate.eleicao.estado },
            );
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
            throw new AppError('Candidato nao encontrado.', 404, 'CANDIDATE_NOT_FOUND', { id, electionId });
        }

        if (existingCandidate.eleicao.estado === 'ABERTA') {
            throw new AppError(
                'Eleicoes abertas nao permitem gerir candidatos pela comissao.',
                409,
                'ELECTION_OPEN_READ_ONLY',
                { electionId },
            );
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

    private isCandidacyWindowOpen(election: {
        dataInicioCandidatura?: Date | string | null;
        dataFimCandidatura?: Date | string | null;
    }) {
        const now = new Date();
        const start = election.dataInicioCandidatura ? new Date(election.dataInicioCandidatura) : null;
        const end = election.dataFimCandidatura ? new Date(election.dataFimCandidatura) : null;

        if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return false;
        }

        return start <= now && now <= end;
    }
}

export const candidatesService = new CandidatesService();
