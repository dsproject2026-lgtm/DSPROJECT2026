import { prisma } from '../lib/prisma.js';
import type { EntityId } from '../types/common.types.js';
import type {
    CreateCandidateApiInput,
    ListCandidatesFilters,
    UpdateCandidateApiInput,
} from '../types/candidates.types.js';

const candidateWithRelationsSelect = {
    id: true,
    eleicaoId: true,
    utilizadorId: true,
    registadoPor: true,
    nome: true,
    fotoUrl: true,
    biografia: true,
    proposta: true,
    estado: true,
    eleicao: {
        select: {
            id: true,
            cargoId: true,
            titulo: true,
            estado: true,
            dataInicioCandidatura: true,
            dataFimCandidatura: true,
            dataInicioVotacao: true,
            dataFimVotacao: true,
        },
    },
    utilizador: {
        select: {
            id: true,
            codigo: true,
            nome: true,
            email: true,
            perfil: true,
            activo: true,
            mustSetPassword: true,
            createdAt: true,
            faculdade: { select: { id: true, nome: true } },
            curso: { select: { id: true, nome: true, faculdadeId: true } },
            ano: true,
        },
    },
    registador: {
        select: {
            id: true,
            codigo: true,
            nome: true,
            email: true,
                perfil: true,
                activo: true,
                mustSetPassword: true,
                createdAt: true,
                faculdade: { select: { id: true, nome: true } },
                curso: { select: { id: true, nome: true, faculdadeId: true } },
                ano: true,
            },
        },
    votos: {
        select: {
            id: true,
            candidatoId: true,
            tokenAnonimo: true,
            dataHora: true,
        },
    },
} as const;

class CandidatesRepository {
    async create(electionId: EntityId, data: CreateCandidateApiInput, registadoPor?: EntityId) {
        return prisma.candidato.create({
            data: {
                eleicaoId: electionId,
                utilizadorId: data.utilizadorId!,
                ...(registadoPor !== undefined ? { registadoPor } : {}),
                nome: data.nome ?? '',
                ...(data.fotoUrl !== undefined ? { fotoUrl: data.fotoUrl } : {}),
                ...(data.biografia !== undefined ? { biografia: data.biografia } : {}),
                ...(data.proposta !== undefined ? { proposta: data.proposta } : {}),
                ...(data.estado !== undefined ? { estado: data.estado } : {}),
            },
            select: candidateWithRelationsSelect,
        });
    }

    async findById(id: EntityId) {
        return prisma.candidato.findUnique({
            where: { id },
            select: candidateWithRelationsSelect,
        });
    }

    async findByIdForElection(id: EntityId, electionId: EntityId) {
        return prisma.candidato.findFirst({
            where: { id, eleicaoId: electionId },
            select: candidateWithRelationsSelect,
        });
    }

    async findAllByElection(electionId: EntityId, filters?: ListCandidatesFilters) {
        return prisma.candidato.findMany({
            where: {
                eleicaoId: electionId,
                ...(filters?.estado ? { estado: filters.estado } : {}),
                ...(filters?.nome ? { nome: { contains: filters.nome, mode: 'insensitive' } } : {}),
                ...(filters?.utilizadorId ? { utilizadorId: filters.utilizadorId } : {}),
            },
            select: candidateWithRelationsSelect,
            orderBy: {
                nome: 'asc',
            },
        });
    }

    async update(id: EntityId, data: UpdateCandidateApiInput) {
        return prisma.candidato.update({
            where: { id },
            data: {
                ...(data.utilizadorId !== undefined ? { utilizadorId: data.utilizadorId } : {}),
                ...(data.nome !== undefined ? { nome: data.nome } : {}),
                ...(data.fotoUrl !== undefined ? { fotoUrl: data.fotoUrl } : {}),
                ...(data.biografia !== undefined ? { biografia: data.biografia } : {}),
                ...(data.proposta !== undefined ? { proposta: data.proposta } : {}),
                ...(data.estado !== undefined ? { estado: data.estado } : {}),
            },
            select: candidateWithRelationsSelect,
        });
    }

    async delete(id: EntityId) {
        return prisma.candidato.delete({
            where: { id },
            select: candidateWithRelationsSelect,
        });
    }

    async findElectionById(electionId: EntityId) {
        return prisma.eleicao.findUnique({
            where: { id: electionId },
            select: {
                id: true,
                estado: true,
                dataInicioCandidatura: true,
                dataFimCandidatura: true,
            },
        });
    }

    async findUserById(userId: EntityId) {
        return prisma.utilizador.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nome: true,
                codigo: true,
                perfil: true,
                activo: true,
                faculdadeId: true,
            },
        });
    }

    async findEligibleVoter(electionId: EntityId, userId: EntityId) {
        return prisma.elegivel.findFirst({
            where: {
                eleicaoId: electionId,
                utilizadorId: userId,
            },
            select: {
                id: true,
                jaVotou: true,
            },
        });
    }

    async findCandidateByUser(userId: EntityId) {
        return prisma.candidato.findMany({
            where: {
                utilizadorId: userId,
            },
            select: candidateWithRelationsSelect,
            orderBy: {
                eleicao: {
                    titulo: 'asc',
                },
            },
        });
    }

    async promoteUserToCandidate(userId: EntityId) {
        return prisma.utilizador.update({
            where: { id: userId },
            data: {
                perfil: 'CANDIDATO',
            },
            select: {
                id: true,
                perfil: true,
                activo: true,
            },
        });
    }

    async findByElectionAndUser(electionId: EntityId, userId: EntityId) {
        return prisma.candidato.findFirst({
            where: {
                eleicaoId: electionId,
                utilizadorId: userId,
            },
            select: {
                id: true,
                eleicaoId: true,
                utilizadorId: true,
            },
        });
    }
}

export const candidatesRepository = new CandidatesRepository();
