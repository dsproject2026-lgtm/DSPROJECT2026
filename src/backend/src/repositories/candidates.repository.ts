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
                utilizadorId: data.utilizadorId,
                ...(registadoPor !== undefined ? { registadoPor } : {}),
                nome: data.nome,
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
            },
        });
    }

    async findUserById(userId: EntityId) {
        return prisma.utilizador.findUnique({
            where: { id: userId },
            select: {
                id: true,
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
