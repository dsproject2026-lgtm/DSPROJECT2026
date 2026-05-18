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
  faculdadeId: true,
  titulo: true,
  descricao: true,
  estado: true,
  escopoEleitores: true,
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
  faculdade: {
    select: {
      id: true,
      nome: true,
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
      ...(data.faculdadeId !== undefined ? { faculdadeId: data.faculdadeId } : {}),
      titulo: data.titulo,
      ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
      estado: 'PROGRAMADA' as const,
      escopoEleitores: data.escopoEleitores ?? 'TODOS',
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

    if (filters?.faculdadeId) {
      where.faculdadeId = filters.faculdadeId;
    }

    return prisma.eleicao.findMany({
      where,
      select: electionWithRelationsSelect,
      orderBy: {
        dataInicioCandidatura: 'desc',
      },
    });
  }

  async syncElectionStates(now = new Date()) {
    const [closedFromOpen, closedFromScheduled, openedFromScheduled] = await prisma.$transaction([
      prisma.eleicao.updateMany({
        where: {
          estado: 'ABERTA',
          dataFimVotacao: {
            not: null,
            lte: now,
          },
        },
        data: {
          estado: 'CONCLUIDA',
        },
      }),
      prisma.eleicao.updateMany({
        where: {
          estado: 'PROGRAMADA',
          dataFimVotacao: {
            not: null,
            lte: now,
          },
        },
        data: {
          estado: 'CONCLUIDA',
        },
      }),
      prisma.eleicao.updateMany({
        where: {
          estado: 'PROGRAMADA',
          dataInicioVotacao: {
            not: null,
            lte: now,
          },
          OR: [{ dataFimVotacao: null }, { dataFimVotacao: { gt: now } }],
        },
        data: {
          estado: 'ABERTA',
        },
      }),
    ]);

    return closedFromOpen.count + closedFromScheduled.count + openedFromScheduled.count;
  }

  async update(id: EntityId, data: UpdateElectionApiInput) {
    const updateData: Record<string, unknown> = {};

    if (data.cargoId !== undefined) {
      updateData.cargoId = data.cargoId;
    }
    if (data.faculdadeId !== undefined) {
      updateData.faculdadeId = data.faculdadeId;
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
    if (data.escopoEleitores !== undefined) {
      updateData.escopoEleitores = data.escopoEleitores;
      if (data.escopoEleitores === 'TODOS' && data.faculdadeId === undefined) {
        updateData.faculdadeId = null;
      }
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
    return prisma.$transaction(async (tx) => {
      await tx.voto.deleteMany({
        where: {
          candidato: {
            eleicaoId: id,
          },
        },
      });
      await tx.comprovativo.deleteMany({ where: { eleicaoId: id } });
      await tx.elegivel.deleteMany({ where: { eleicaoId: id } });
      await tx.candidato.deleteMany({ where: { eleicaoId: id } });

      return tx.eleicao.delete({
        where: { id },
        select: { id: true, titulo: true },
      });
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

  async findFaculdadeById(faculdadeId: EntityId) {
    return prisma.faculdade.findUnique({
      where: { id: faculdadeId },
      select: {
        id: true,
        nome: true,
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
        activo: true,
        faculdadeId: true,
      },
    });
  }

  async promoteUsersToCandidate(userIds: EntityId[]) {
    if (userIds.length === 0) {
      return 0;
    }

    const result = await prisma.utilizador.updateMany({
      where: {
        id: {
          in: userIds,
        },
        perfil: 'ELEITOR',
      },
      data: {
        perfil: 'CANDIDATO',
      },
    });

    return result.count;
  }

  async findCandidateUsers(search?: string) {
    return prisma.utilizador.findMany({
      where: {
        perfil: {
          in: ['ELEITOR', 'CANDIDATO'],
        },
        activo: true,
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
        perfil: true,
        activo: true,
        faculdade: {
          select: {
            id: true,
            nome: true,
          },
        },
        curso: {
          select: {
            id: true,
            nome: true,
            faculdadeId: true,
          },
        },
        ano: true,
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

  async assignEligibleElectorsForElection(electionId: EntityId, params: {
    escopoEleitores: 'TODOS' | 'FACULDADE';
    faculdadeId?: string | null;
  }) {
    const electors = await prisma.utilizador.findMany({
      where: {
        perfil: {
          in: ['ELEITOR', 'CANDIDATO'],
        },
        activo: true,
        ...(params.escopoEleitores === 'FACULDADE'
          ? { faculdadeId: params.faculdadeId ?? '__none__' }
          : {}),
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
