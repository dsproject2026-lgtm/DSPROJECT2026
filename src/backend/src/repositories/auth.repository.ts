import { prisma } from '../lib/prisma.js';
import type { CreateAuthUserInput, LoginInput } from '../types/auth.types.js';

const utilizadorPublicSelect = {
  id: true,
  codigo: true,
  nome: true,
  email: true,
  perfil: true,
  activo: true,
  mustSetPassword: true,
  createdAt: true,
} as const;

const utilizadorAuthSelect = {
  ...utilizadorPublicSelect,
  senhaHash: true,
  passwordSetupTokenHash: true,
  passwordSetupTokenExpiresAt: true,
  candidaturas: true,
} as const;

class AuthRepository {
  async createUser({
    nome,
    codigo,
    email,
    senhaHash,
    perfil,
    activo,
    mustSetPassword,
  }: CreateAuthUserInput) {
    return prisma.utilizador.create({
      data: {
        nome,
        codigo,
        ...(email !== undefined ? { email } : {}),
        ...(senhaHash !== undefined ? { senhaHash } : {}),
        perfil,
        ...(activo !== undefined ? { activo } : {}),
        ...(mustSetPassword !== undefined ? { mustSetPassword } : {}),
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

  async findUserById(userId: string) {
    return prisma.utilizador.findUnique({
      where: { id: userId },
      select: utilizadorAuthSelect,
    });
  }

  async updatePasswordSetupTokenById(
    userId: string,
    passwordSetupTokenHash: string,
    passwordSetupTokenExpiresAt: Date,
  ) {
    return prisma.utilizador.update({
      where: { id: userId },
      data: {
        passwordSetupTokenHash,
        passwordSetupTokenExpiresAt,
      },
    });
  }

  async completeFirstAccessById(userId: string, senhaHash: string) {
    return prisma.utilizador.update({
      where: { id: userId },
      data: {
        senhaHash,
        mustSetPassword: false,
        passwordSetupTokenHash: null,
        passwordSetupTokenExpiresAt: null,
      },
      select: utilizadorAuthSelect,
    });
  }

  async createRefreshToken({
    userId,
    tokenHash,
    expiresAt,
    ip,
    userAgent,
  }: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }) {
    return prisma.refreshToken.create({
      data: {
        utilizadorId: userId,
        tokenHash,
        expiresAt,
        ...(ip !== undefined ? { ip } : {}),
        ...(userAgent !== undefined ? { userAgent } : {}),
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        utilizador: {
          select: utilizadorAuthSelect,
        },
      },
    });
  }

  async rotateRefreshToken({
    currentTokenId,
    replacedByTokenHash,
    nextTokenHash,
    nextExpiresAt,
    userId,
    ip,
    userAgent,
  }: {
    currentTokenId: string;
    replacedByTokenHash: string;
    nextTokenHash: string;
    nextExpiresAt: Date;
    userId: string;
    ip?: string;
    userAgent?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: currentTokenId },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash,
        },
      });

      return tx.refreshToken.create({
        data: {
          utilizadorId: userId,
          tokenHash: nextTokenHash,
          expiresAt: nextExpiresAt,
          ...(ip !== undefined ? { ip } : {}),
          ...(userAgent !== undefined ? { userAgent } : {}),
        },
      });
    });
  }

  async revokeRefreshTokenByHash(tokenHash: string) {
    const currentToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    if (!currentToken || currentToken.revokedAt) {
      return;
    }

    await prisma.refreshToken.update({
      where: { id: currentToken.id },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export const authRepository = new AuthRepository();
