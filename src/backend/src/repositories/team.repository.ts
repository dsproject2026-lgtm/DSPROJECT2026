import { prisma } from '../lib/prisma.js';
import type { Perfil } from '../types/model.types.js';

const teamSelect = {
  id: true,
  utilizadorId: true,
  nome: true,
  email: true,
  perfil: true,
  codigo: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} as const;

class TeamRepository {
  async findAll() {
    return prisma.team.findMany({
      select: teamSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return prisma.team.findUnique({ where: { email }, select: teamSelect });
  }

  async findLastCodeForYear(year: number) {
    return prisma.team.findFirst({
      where: {
        codigo: {
          endsWith: `.${year}`,
        },
      },
      select: { codigo: true },
      orderBy: { codigo: 'desc' },
    });
  }

  async create(data: {
    utilizadorId: string;
    nome: string;
    email: string;
    perfil: Perfil;
    codigo: string;
  }) {
    return prisma.team.create({
      data,
      select: teamSelect,
    });
  }

  async updateStatus(id: string, activo: boolean) {
    return prisma.$transaction(async (tx) => {
      const member = await tx.team.update({
        where: { id },
        data: { activo },
        select: teamSelect,
      });

      await tx.utilizador.update({
        where: { id: member.utilizadorId },
        data: { activo },
      });

      return member;
    });
  }
}

export const teamRepository = new TeamRepository();
