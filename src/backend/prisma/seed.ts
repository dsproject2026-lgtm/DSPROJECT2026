import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

config({ path: '.env' });

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/dsproject2026?schema=public';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 12);

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

function addDays(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

async function upsertUser(data: {
  codigo: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'GESTOR_ELEITORAL' | 'AUDITOR' | 'ELEITOR' | 'CANDIDATO';
  senha: string;
}) {
  const senhaHash = await bcrypt.hash(data.senha, SALT_ROUNDS);

  return prisma.utilizador.upsert({
    where: { codigo: data.codigo },
    update: {
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      activo: true,
      mustSetPassword: false,
      senhaHash,
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null,
    },
    create: {
      codigo: data.codigo,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      activo: true,
      mustSetPassword: false,
      senhaHash,
    },
  });
}

async function getOrCreateCargo(nome: string, descricao: string) {
  const existing = await prisma.cargo.findFirst({
    where: { nome },
  });

  if (existing) {
    return prisma.cargo.update({
      where: { id: existing.id },
      data: { descricao },
    });
  }

  return prisma.cargo.create({
    data: { nome, descricao },
  });
}

async function getOrCreateElection(data: {
  cargoId: string;
  titulo: string;
  descricao: string;
  estado:
    | 'PENDENTE'
    | 'ABERTA'
    | 'CONCLUIDA'
    | 'CANCELADA';
  dataInicioCandidatura: Date | null;
  dataFimCandidatura: Date | null;
  dataInicioVotacao: Date | null;
  dataFimVotacao: Date | null;
}) {
  const existing = await prisma.eleicao.findFirst({
    where: {
      cargoId: data.cargoId,
      titulo: data.titulo,
    },
  });

  if (existing) {
    return prisma.eleicao.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.eleicao.create({
    data,
  });
}

async function main() {
  const now = new Date();

  const admin = await upsertUser({
    codigo: 'ADMIN-2026',
    nome: 'Administrador Sistema',
    email: 'admin@dsproject2026.local',
    perfil: 'ADMIN',
    senha: 'Admin@2026',
  });

  const gestor = await upsertUser({
    codigo: 'GESTOR-2026',
    nome: 'Gestor Eleitoral',
    email: 'gestor@dsproject2026.local',
    perfil: 'GESTOR_ELEITORAL',
    senha: 'Gestor@2026',
  });

  const auditor = await upsertUser({
    codigo: 'AUDITOR-2026',
    nome: 'Auditor Geral',
    email: 'auditor@dsproject2026.local',
    perfil: 'AUDITOR',
    senha: 'Auditor@2026',
  });

  const eleitor = await upsertUser({
    codigo: '2026001',
    nome: 'Eleitor de Teste',
    email: 'eleitor@dsproject2026.local',
    perfil: 'ELEITOR',
    senha: '12345678',
  });

  await upsertUser({
    codigo: 'C12023',
    nome: 'Eleitor C12023',
    email: 'c12023@dsproject2026.local',
    perfil: 'ELEITOR',
    senha: '12345678',
  });

  await upsertUser({
    codigo: 'C12024',
    nome: 'Eleitor C12024',
    email: 'c12024@dsproject2026.local',
    perfil: 'ELEITOR',
    senha: '12345678',
  });

  await upsertUser({
    codigo: 'C12025',
    nome: 'Eleitor C12025',
    email: 'c12025@dsproject2026.local',
    perfil: 'ELEITOR',
    senha: '12345678',
  });

  const candidatoA = await upsertUser({
    codigo: 'CAND-2026-01',
    nome: 'Ricardo Mondlane',
    email: 'ricardo@dsproject2026.local',
    perfil: 'CANDIDATO',
    senha: '12345678',
  });

  const candidatoB = await upsertUser({
    codigo: 'CAND-2026-02',
    nome: 'Ana Bela Chissano',
    email: 'anabela@dsproject2026.local',
    perfil: 'CANDIDATO',
    senha: '12345678',
  });

  const candidatoC = await upsertUser({
    codigo: 'CAND-2026-03',
    nome: 'Sergio Mabunda',
    email: 'sergio@dsproject2026.local',
    perfil: 'CANDIDATO',
    senha: '12345678',
  });

  const cargoPresidente = await getOrCreateCargo(
    'Presidente da Associacao de Estudantes',
    'Cargo executivo principal da associacao.',
  );

  const cargoConselho = await getOrCreateCargo(
    'Representante do Conselho Universitario',
    'Representacao estudantil no conselho universitario.',
  );

  const electionOpen = await getOrCreateElection({
    cargoId: cargoPresidente.id,
    titulo: 'Eleicao Geral AEUP 2026',
    descricao: 'Eleicao oficial da associacao de estudantes para o mandato 2026/2028.',
    estado: 'ABERTA',
    dataInicioCandidatura: addDays(now, -25),
    dataFimCandidatura: addDays(now, -12),
    dataInicioVotacao: addDays(now, -1),
    dataFimVotacao: addDays(now, 5),
  });

  const electionConcluded = await getOrCreateElection({
    cargoId: cargoConselho.id,
    titulo: 'Eleicao Conselho Universitario 2025',
    descricao: 'Eleicao concluida para representante estudantil no conselho.',
    estado: 'CONCLUIDA',
    dataInicioCandidatura: addDays(now, -120),
    dataFimCandidatura: addDays(now, -105),
    dataInicioVotacao: addDays(now, -95),
    dataFimVotacao: addDays(now, -92),
  });

  const openCandidateA = await prisma.candidato.upsert({
    where: {
      eleicaoId_utilizadorId: {
        eleicaoId: electionOpen.id,
        utilizadorId: candidatoA.id,
      },
    },
    update: {
      nome: 'Ricardo Mondlane',
      estado: 'APROVADO',
      biografia: 'Candidato com foco em representacao estudantil e transparencia.',
      proposta: 'Melhorar comunicacao, apoio academico e participacao estudantil.',
      registadoPor: gestor.id,
    },
    create: {
      eleicaoId: electionOpen.id,
      utilizadorId: candidatoA.id,
      nome: 'Ricardo Mondlane',
      estado: 'APROVADO',
      biografia: 'Candidato com foco em representacao estudantil e transparencia.',
      proposta: 'Melhorar comunicacao, apoio academico e participacao estudantil.',
      registadoPor: gestor.id,
    },
  });

  const openCandidateB = await prisma.candidato.upsert({
    where: {
      eleicaoId_utilizadorId: {
        eleicaoId: electionOpen.id,
        utilizadorId: candidatoB.id,
      },
    },
    update: {
      nome: 'Ana Bela Chissano',
      estado: 'APROVADO',
      biografia: 'Candidata com experiencia em lideranca e advocacia academica.',
      proposta: 'Fortalecer inclusao, debate e atividades de desenvolvimento estudantil.',
      registadoPor: gestor.id,
    },
    create: {
      eleicaoId: electionOpen.id,
      utilizadorId: candidatoB.id,
      nome: 'Ana Bela Chissano',
      estado: 'APROVADO',
      biografia: 'Candidata com experiencia em lideranca e advocacia academica.',
      proposta: 'Fortalecer inclusao, debate e atividades de desenvolvimento estudantil.',
      registadoPor: gestor.id,
    },
  });

  const concludedCandidateA = await prisma.candidato.upsert({
    where: {
      eleicaoId_utilizadorId: {
        eleicaoId: electionConcluded.id,
        utilizadorId: candidatoA.id,
      },
    },
    update: {
      nome: 'Ricardo Mondlane',
      estado: 'APROVADO',
      registadoPor: admin.id,
    },
    create: {
      eleicaoId: electionConcluded.id,
      utilizadorId: candidatoA.id,
      nome: 'Ricardo Mondlane',
      estado: 'APROVADO',
      registadoPor: admin.id,
    },
  });

  const concludedCandidateC = await prisma.candidato.upsert({
    where: {
      eleicaoId_utilizadorId: {
        eleicaoId: electionConcluded.id,
        utilizadorId: candidatoC.id,
      },
    },
    update: {
      nome: 'Sergio Mabunda',
      estado: 'APROVADO',
      registadoPor: admin.id,
    },
    create: {
      eleicaoId: electionConcluded.id,
      utilizadorId: candidatoC.id,
      nome: 'Sergio Mabunda',
      estado: 'APROVADO',
      registadoPor: admin.id,
    },
  });

  const allElectors = await prisma.utilizador.findMany({
    where: { perfil: 'ELEITOR', activo: true },
    select: { id: true, codigo: true },
  });

  for (const electorUser of allElectors) {
    await prisma.elegivel.upsert({
      where: {
        eleicaoId_utilizadorId: {
          eleicaoId: electionOpen.id,
          utilizadorId: electorUser.id,
        },
      },
      update: {
        jaVotou: false,
      },
      create: {
        eleicaoId: electionOpen.id,
        utilizadorId: electorUser.id,
        jaVotou: false,
      },
    });

    await prisma.elegivel.upsert({
      where: {
        eleicaoId_utilizadorId: {
          eleicaoId: electionConcluded.id,
          utilizadorId: electorUser.id,
        },
      },
      update: {
        jaVotou: electorUser.id === eleitor.id,
      },
      create: {
        eleicaoId: electionConcluded.id,
        utilizadorId: electorUser.id,
        jaVotou: electorUser.id === eleitor.id,
      },
    });
  }

  const existingVotesForConcludedElection = await prisma.voto.count({
    where: {
      candidato: {
        eleicaoId: electionConcluded.id,
      },
    },
  });

  if (existingVotesForConcludedElection === 0) {
    const tokens = Array.from({ length: 8 }, (_, index) => `seed-vote-token-a-${index + 1}`);
    const otherTokens = Array.from({ length: 5 }, (_, index) => `seed-vote-token-b-${index + 1}`);

    await prisma.voto.createMany({
      data: [
        ...tokens.map((token) => ({
          candidatoId: concludedCandidateA.id,
          tokenAnonimo: token,
        })),
        ...otherTokens.map((token) => ({
          candidatoId: concludedCandidateC.id,
          tokenAnonimo: token,
        })),
      ],
    });
  }

  await prisma.comprovativo.upsert({
    where: {
      codigoVerificacao: 'RCPT-SEED-2026-ELEITOR',
    },
    update: {
      utilizadorId: eleitor.id,
      eleicaoId: electionConcluded.id,
    },
    create: {
      codigoVerificacao: 'RCPT-SEED-2026-ELEITOR',
      utilizadorId: eleitor.id,
      eleicaoId: electionConcluded.id,
    },
  });

  console.log('Seed concluido com sucesso.');
  console.log(`Eleicao aberta: ${electionOpen.id}`);
  console.log(`Eleicao concluida: ${electionConcluded.id}`);
  console.log(`Candidatos da eleicao aberta: ${openCandidateA.id}, ${openCandidateB.id}`);
  console.log(`Eleitores elegiveis seedados: ${allElectors.length}`);
  console.log(`Perfis: ADMIN=${admin.codigo}, GESTOR=${gestor.codigo}, AUDITOR=${auditor.codigo}, ELEITOR=${eleitor.codigo}`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
