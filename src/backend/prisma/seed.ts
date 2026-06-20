import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://marlon_coder:Marlon0505@localhost:5432/dsproject2026',
  }),
});

const DEFAULT_PASSWORD = '123456789';
const SALT_ROUNDS = Number.parseInt(process.env.SALT_ROUNDS ?? '12', 10);

async function main() {
  const senhaHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const admin = await prisma.utilizador.upsert({
    where: { codigo: 'ADM001' },
    update: {
      nome: 'Administrador',
      senhaHash,
      perfil: 'ADMIN',
      activo: true,
      mustSetPassword: false,
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null,
    },
    create: {
      codigo: 'ADM001',
      nome: 'Administrador',
      senhaHash,
      perfil: 'ADMIN',
      activo: true,
      mustSetPassword: false,
    },
  });

  const comissao = await prisma.utilizador.upsert({
    where: { codigo: 'CE001' },
    update: {
      nome: 'Comissao Eleitoral',
      email: 'comissao.eleitoral@example.com',
      senhaHash,
      perfil: 'GESTOR_ELEITORAL',
      activo: true,
      mustSetPassword: false,
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null,
    },
    create: {
      codigo: 'CE001',
      nome: 'Comissao Eleitoral',
      email: 'comissao.eleitoral@example.com',
      senhaHash,
      perfil: 'GESTOR_ELEITORAL',
      activo: true,
      mustSetPassword: false,
    },
  });

  await prisma.team.upsert({
    where: { codigo: 'CE001' },
    update: {
      utilizadorId: comissao.id,
      nome: comissao.nome,
      email: comissao.email ?? 'comissao.eleitoral@example.com',
      perfil: comissao.perfil,
      activo: comissao.activo,
    },
    create: {
      utilizadorId: comissao.id,
      codigo: comissao.codigo,
      nome: comissao.nome,
      email: comissao.email ?? 'comissao.eleitoral@example.com',
      perfil: comissao.perfil,
      activo: comissao.activo,
    },
  });

  console.log('Seed concluido:', {
    admin: admin.codigo,
    comissao: comissao.codigo,
  });
}

main()
  .catch((error) => {
    console.error('Falha ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
