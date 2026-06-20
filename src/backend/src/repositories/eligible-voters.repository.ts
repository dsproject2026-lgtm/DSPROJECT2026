import { prisma } from '../lib/prisma.js';
import type { EntityId } from '../types/common.types.js';
import type { ListEligibleVotersFilters, UpdateEligibleVoterInput } from '../types/eligible-voters.types.js';

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
      escopoEleitores: true,
      faculdadeId: true,
      faculdade: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
  utilizador: {
    select: {
      id: true,
      codigo: true,
      nome: true,
      email: true,
      faculdadeId: true,
      cursoId: true,
      perfil: true,
      activo: true,
      mustSetPassword: true,
      createdAt: true,
      faculdade: { select: { id: true, nome: true } },
      curso: { select: { id: true, nome: true, faculdadeId: true } },
      ano: true,
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
        escopoEleitores: true,
        faculdadeId: true,
        faculdade: {
          select: {
            id: true,
            nome: true,
          },
        },
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
        faculdadeId: true,
        cursoId: true,
        ano: true,
        faculdade: { select: { id: true, nome: true } },
        curso: { select: { id: true, nome: true, faculdadeId: true } },
      },
    });
  }

  async findFacultyByName(nome: string) {
    return prisma.faculdade.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  async createFaculty(nome: string) {
    return prisma.faculdade.create({
      data: { nome },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  async updateUserFaculty(userId: EntityId, faculdadeId: EntityId) {
    return prisma.utilizador.update({
      where: { id: userId },
      data: { faculdadeId },
      select: {
        id: true,
        codigo: true,
        nome: true,
        email: true,
        perfil: true,
        activo: true,
        mustSetPassword: true,
        createdAt: true,
        faculdadeId: true,
        cursoId: true,
        ano: true,
        faculdade: { select: { id: true, nome: true } },
        curso: { select: { id: true, nome: true, faculdadeId: true } },
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

  async findByIdForElection(id: EntityId, electionId: EntityId) {
    return prisma.elegivel.findFirst({
      where: {
        id,
        eleicaoId: electionId,
      },
      select: eligibleVoterSelect,
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

  async updateUser(userId: EntityId, data: UpdateEligibleVoterInput) {
    return prisma.utilizador.update({
      where: { id: userId },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.ano !== undefined ? { ano: data.ano } : {}),
      },
      select: {
        id: true,
      },
    });
  }

  async updateUserStatus(userId: EntityId, activo: boolean) {
    return prisma.utilizador.update({
      where: { id: userId },
      data: { activo },
      select: {
        id: true,
        activo: true,
      },
    });
  }

  async delete(id: EntityId) {
    return prisma.elegivel.delete({
      where: { id },
      select: eligibleVoterSelect,
    });
  }
}

export const eligibleVotersRepository = new EligibleVotersRepository();
