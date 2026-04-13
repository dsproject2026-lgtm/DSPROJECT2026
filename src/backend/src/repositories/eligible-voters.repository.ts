import { prisma } from '../lib/prisma.js';
import type { EntityId } from '../types/common.types.js';
import type { ListEligibleVotersFilters } from '../types/eligible-voters.types.js';

const eligibleVoterSelect = {
  id: true,
  eleicaoId: true,
  utilizadorId: true,
  jaVotou: true,
  importadoEm: true,
  eleicao: {
    select: {
      id: true,
      cargoId: true,
      titulo: true,
      estado: true,
      descricao: true,
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
    },
  },
} as const;

class EligibleVotersRepository {
  async findElectionById(electionId: EntityId) {
    return prisma.eleicao.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        estado: true,
        titulo: true,
      },
    });
  }

  async findAllByElection(electionId: EntityId, filters?: ListEligibleVotersFilters) {
    return prisma.elegivel.findMany({
      where: {
        eleicaoId: electionId,
        ...(filters?.jaVotou !== undefined ? { jaVotou: filters.jaVotou } : {}),
        ...(filters?.codigo
          ? {
              utilizador: {
                is: {
                  codigo: { contains: filters.codigo, mode: 'insensitive' },
                },
              },
            }
          : {}),
        ...(filters?.nome
          ? {
              utilizador: {
                is: {
                  nome: { contains: filters.nome, mode: 'insensitive' },
                },
              },
            }
          : {}),
      },
      select: eligibleVoterSelect,
      orderBy: {
        importadoEm: 'desc',
      },
    });
  }

  async findUserByCodigo(codigo: string) {
    return prisma.utilizador.findUnique({
      where: { codigo },
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
    });
  }

  async findByElectionAndUser(electionId: EntityId, userId: EntityId) {
    return prisma.elegivel.findFirst({
      where: {
        eleicaoId: electionId,
        utilizadorId: userId,
      },
      select: {
        id: true,
      },
    });
  }

  async create(electionId: EntityId, userId: EntityId) {
    return prisma.elegivel.create({
      data: {
        eleicaoId: electionId,
        utilizadorId: userId,
      },
      select: eligibleVoterSelect,
    });
  }
}

export const eligibleVotersRepository = new EligibleVotersRepository();