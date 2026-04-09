import { prisma } from '../lib/prisma.js';
import type { CreateAuthUserInput, LoginInput } from '../types/auth.types.js';

const utilizadorPublicSelect = {
  id: true,
  codigo: true,
  nome: true,
  perfil: true,
  activo: true,
  createdAt: true,
} as const;

const utilizadorAuthSelect = {
  ...utilizadorPublicSelect,
  senhaHash: true,
  candidaturas: true,
} as const;

class AuthRepository {
  async createUser({ nome, codigo, senhaHash, perfil, activo }: CreateAuthUserInput) {
    return prisma.utilizador.create({
      data: {
        nome,
        codigo,
        senhaHash,
        perfil,
        ...(activo !== undefined ? { activo } : {}),
      },
      select: utilizadorPublicSelect,
    });
  }

  async findUserByCodigo(codigo: LoginInput['codigo']) {
    return prisma.utilizador.findUnique({
      where: { codigo },
      select: utilizadorAuthSelect,
    });
  }
}

export const authRepository = new AuthRepository();
