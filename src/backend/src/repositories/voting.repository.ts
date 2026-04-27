import { prisma } from '../lib/prisma.js';
import { generateSecureToken } from '../utils/secure-token.js';

class VotingRepository {
  async findElectionById(electionId: string) {
    return prisma.eleicao.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        titulo: true,
        estado: true,
        dataInicioVotacao: true,
        dataFimVotacao: true,
      },
    });
  }

  async findEligibleVoter(electionId: string, userId: string) {
    return prisma.elegivel.findFirst({
      where: {
        eleicaoId: electionId,
        utilizadorId: userId,
      },
      select: {
        id: true,
        eleicaoId: true,
        utilizadorId: true,
        jaVotou: true,
      },
    });
  }

  async findUserById(userId: string) {
    return prisma.utilizador.findUnique({
      where: { id: userId },
      select: {
        id: true,
        perfil: true,
        activo: true,
      },
    });
  }

  async ensureEligibleVoter(electionId: string, userId: string) {
    return prisma.elegivel.upsert({
      where: {
        eleicaoId_utilizadorId: {
          eleicaoId: electionId,
          utilizadorId: userId,
        },
      },
      update: {},
      create: {
        eleicaoId: electionId,
        utilizadorId: userId,
        jaVotou: false,
      },
      select: {
        id: true,
        eleicaoId: true,
        utilizadorId: true,
        jaVotou: true,
      },
    });
  }

  async findApprovedCandidatesByElection(electionId: string) {
    return prisma.candidato.findMany({
      where: {
        eleicaoId: electionId,
        estado: 'APROVADO',
      },
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        biografia: true,
        proposta: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findCandidateByIdForElection(candidatoId: string, electionId: string) {
    return prisma.candidato.findFirst({
      where: {
        id: candidatoId,
        eleicaoId: electionId,
      },
      select: {
        id: true,
        estado: true,
      },
    });
  }

  async castVote(params: { electionId: string; userId: string; eligibleId: string; candidateId: string }) {
    const receiptCode = `RCPT-${generateSecureToken().slice(0, 16).toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      const vote = await tx.voto.create({
        data: {
          candidatoId: params.candidateId,
          tokenAnonimo: generateSecureToken(),
        },
        select: {
          id: true,
          candidatoId: true,
          dataHora: true,
        },
      });

      await tx.elegivel.update({
        where: { id: params.eligibleId },
        data: { jaVotou: true },
      });

      const receipt = await tx.comprovativo.create({
        data: {
          utilizadorId: params.userId,
          eleicaoId: params.electionId,
          codigoVerificacao: receiptCode,
        },
        select: {
          codigoVerificacao: true,
          emitidoEm: true,
        },
      });

      return {
        vote,
        receipt,
      };
    });
  }

  async findReceiptByElectionAndUser(electionId: string, userId: string) {
    return prisma.comprovativo.findFirst({
      where: {
        eleicaoId: electionId,
        utilizadorId: userId,
      },
      select: {
        codigoVerificacao: true,
        emitidoEm: true,
      },
      orderBy: {
        emitidoEm: 'desc',
      },
    });
  }

  async findAllCandidatesByElection(electionId: string) {
    return prisma.candidato.findMany({
      where: {
        eleicaoId: electionId,
      },
      select: {
        id: true,
        nome: true,
        estado: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findVotesByElection(electionId: string) {
    return prisma.voto.findMany({
      where: {
        candidato: {
          eleicaoId: electionId,
        },
      },
      select: {
        candidatoId: true,
      },
    });
  }

  async countEligibleVotersByElection(electionId: string) {
    return prisma.elegivel.count({
      where: {
        eleicaoId: electionId,
      },
    });
  }
}

export const votingRepository = new VotingRepository();
