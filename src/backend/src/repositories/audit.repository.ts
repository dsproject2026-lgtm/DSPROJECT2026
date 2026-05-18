import { prisma } from '../lib/prisma.js';

class AuditRepository {
  async findAll(filters?: { electionId?: string | undefined }) {
    const where = filters?.electionId
      ? {
          OR: [
            { entidade: 'ELEICAO', entidadeId: filters.electionId },
            { entidade: 'CANDIDATO', entidadeId: filters.electionId },
            { entidade: 'ELEITOR_ELEGIVEL', entidadeId: filters.electionId },
            { entidade: 'VOTO', entidadeId: filters.electionId },
          ],
        }
      : undefined;

    return prisma.logAuditoria.findMany({
      ...(where ? { where } : {}),
      select: {
        id: true,
        accao: true,
        entidade: true,
        entidadeId: true,
        ip: true,
        timestamp: true,
        utilizador: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            perfil: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });
  }

  async create(data: {
    utilizadorId?: string | null | undefined;
    accao: string;
    entidade?: string | null | undefined;
    entidadeId?: string | null | undefined;
    ip?: string | null | undefined;
  }) {
    return prisma.logAuditoria.create({
      data: {
        utilizadorId: data.utilizadorId ?? null,
        accao: data.accao,
        entidade: data.entidade ?? null,
        entidadeId: data.entidadeId ?? null,
        ip: data.ip ?? null,
      },
    });
  }
}

export const auditRepository = new AuditRepository();
