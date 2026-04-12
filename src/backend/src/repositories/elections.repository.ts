import { prisma } from '../lib/prisma.js';
import type { EntityId } from '../types/common.types.js';
import type { CreateElectionApiInput, ListElectionsFilters } from '../types/eleicoes.types.js';

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
  async create(data: CreateElectionApiInput) {
    const createData = {
      cargoId: data.cargoId,
      titulo: data.titulo,
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      estado: data.estado ?? 'RASCUNHO',
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

  async update(id: EntityId, data: Partial<CreateElectionApiInput>) {
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
}

export const electionsRepository = new ElectionsRepository();
