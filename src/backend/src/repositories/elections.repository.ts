import { prisma } from '../lib/prisma.js';
import type { EntityId } from '../types/common.types.js';
import type {
  CreateElectionApiInput,
  ListElectionsFilters,
  UpdateElectionApiInput,
} from '../types/eleicoes.types.js';

const ACTIVE_ELECTION_STATES = ['ABERTA'] as const;

const electionWithRelationsSelect = {
  id: true,
  cargoId: true,
  titulo: true,
  descricao: true,
  estado: true,
  dataInicioCandidatura: true,
  dataFimCandidatura: true,
  dataInicioVotacao: true,
  dataFimVotacao: true,
  cargo: {
    select: {
      id: true,
      nome: true,
      descricao: true,
    },
  },
  candidatos: {
    select: {
      id: true,
      nome: true,
      estado: true,
    },
  },
  elegiveis: {
    select: {
      id: true,
      utilizadorId: true,
      jaVotou: true,
    },
  },
  comprovativos: {
    select: {
      id: true,
      codigoVerificacao: true,
      emitidoEm: true,
    },
  },
} as const;

class ElectionsRepository {
  async create(data: CreateElectionApiInput, registadoPor?: EntityId) {
    const createData = {
      cargoId: data.cargoId,
      titulo: data.titulo,
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      estado: data.estado ?? 'PENDENTE',
      dataInicioCandidatura: data.dataInicioCandidatura
        ? new Date(data.dataInicioCandidatura)
        : null,
      dataFimCandidatura: data.dataFimCandidatura
        ? new Date(data.dataFimCandidatura)
        : null,
      dataInicioVotacao: data.dataInicioVotacao
        ? new Date(data.dataInicioVotacao)
        : null,
      dataFimVotacao: data.dataFimVotacao
        ? new Date(data.dataFimVotacao)
        : null,
      ...(data.candidatos && data.candidatos.length > 0
        ? {
            candidatos: {
              create: data.candidatos.map((candidate) => ({
                utilizadorId: candidate.utilizadorId,
                nome: candidate.nome,
                ...(registadoPor !== undefined ? { registadoPor } : {}),
                ...(candidate.fotoUrl !== undefined ? { fotoUrl: candidate.fotoUrl } : {}),
                ...(candidate.biografia !== undefined ? { biografia: candidate.biografia } : {}),
                ...(candidate.proposta !== undefined ? { proposta: candidate.proposta } : {}),
                ...(candidate.estado !== undefined ? { estado: candidate.estado } : {}),
              })),
            },
          }
        : {}),
    };

    return prisma.eleicao.create({
      data: createData,
      select: electionWithRelationsSelect,
    });
  }

  async findById(id: EntityId) {
    return prisma.eleicao.findUnique({
      where: { id },
      select: electionWithRelationsSelect,
    });
  }

  async findAll(filters?: ListElectionsFilters) {
    const where: Record<string, unknown> = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.cargoId) {
      where.cargoId = filters.cargoId;
    }

    return prisma.eleicao.findMany({
      where,
      select: electionWithRelationsSelect,
      orderBy: {
        dataInicioCandidatura: 'desc',
      },
    });
  }

  async update(id: EntityId, data: UpdateElectionApiInput) {
    const updateData: Record<string, unknown> = {};

    if (data.cargoId !== undefined) {
      updateData.cargoId = data.cargoId;
    }
    if (data.titulo !== undefined) {
      updateData.titulo = data.titulo;
    }
    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }
    if (data.estado !== undefined) {
      updateData.estado = data.estado;
    }
    if (data.dataInicioCandidatura !== undefined) {
      updateData.dataInicioCandidatura = data.dataInicioCandidatura
        ? new Date(data.dataInicioCandidatura)
        : null;
    }
    if (data.dataFimCandidatura !== undefined) {
      updateData.dataFimCandidatura = data.dataFimCandidatura
        ? new Date(data.dataFimCandidatura)
        : null;
    }
    if (data.dataInicioVotacao !== undefined) {
      updateData.dataInicioVotacao = data.dataInicioVotacao
        ? new Date(data.dataInicioVotacao)
        : null;
    }
    if (data.dataFimVotacao !== undefined) {
      updateData.dataFimVotacao = data.dataFimVotacao
        ? new Date(data.dataFimVotacao)
        : null;
    }

    return prisma.eleicao.update({
      where: { id },
      data: updateData,
      select: electionWithRelationsSelect,
    });
  }

  async delete(id: EntityId) {
    return prisma.eleicao.delete({
      where: { id },
      select: { id: true, titulo: true },
    });
  }

  async findCargoById(cargoId: EntityId) {
    return prisma.cargo.findUnique({
      where: { id: cargoId },
      select: {
        id: true,
        nome: true,
        descricao: true,
      },
    });
  }

  async findUsersByIds(userIds: EntityId[]) {
    if (userIds.length === 0) {
      return [];
    }

    return prisma.utilizador.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        perfil: true,
      },
    });
  }

  async findCandidateUsers(search?: string) {
    return prisma.utilizador.findMany({
      where: {
        perfil: 'CANDIDATO',
        ...(search && search.trim() !== ''
          ? {
              OR: [
                { nome: { contains: search.trim(), mode: 'insensitive' } },
                { codigo: { contains: search.trim(), mode: 'insensitive' } },
                { email: { contains: search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        codigo: true,
        nome: true,
        email: true,
        activo: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findActiveElectionByCargo(cargoId: EntityId, excludeElectionId?: EntityId) {
    return prisma.eleicao.findFirst({
      where: {
        cargoId,
        estado: {
          in: [...ACTIVE_ELECTION_STATES],
        },
        ...(excludeElectionId !== undefined ? { id: { not: excludeElectionId } } : {}),
      },
      select: {
        id: true,
        cargoId: true,
        titulo: true,
        estado: true,
      },
    });
  }

  async assignAllActiveElectorsAsEligible(electionId: EntityId) {
    const electors = await prisma.utilizador.findMany({
      where: {
        perfil: 'ELEITOR',
        activo: true,
      },
      select: {
        id: true,
      },
    });

    if (electors.length === 0) {
      return 0;
    }

    const result = await prisma.elegivel.createMany({
      data: electors.map((elector) => ({
        eleicaoId: electionId,
        utilizadorId: elector.id,
        jaVotou: false,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }
}

export const electionsRepository = new ElectionsRepository();
